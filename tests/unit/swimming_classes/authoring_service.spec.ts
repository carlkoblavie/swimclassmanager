import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { LevelFactory } from '#database/factories/level_factory'
import { SkillFactory } from '#database/factories/skill_factory'
import SchoolLevelSetting from '#models/school_level_setting'
import ClassScheduleGenerationService from '#services/class_schedule_generation_service'
import ClassSeriesAuthoringService from '#services/class_series_authoring_service'
import type { StoreSwimmingClassInput } from '#validators/swimming_class'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'

type AssertSubset = {
  fail(message?: string): never
  equal(actual: unknown, expected: unknown): void
}

async function expectAuthoringError(
  assert: AssertSubset,
  callback: () => Promise<unknown>,
  expectedMessage: string
) {
  try {
    await callback()
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error
    }

    assert.equal(error.message, expectedMessage)
    return
  }

  assert.fail('Expected class authoring to fail')
}

function authoringService() {
  return new ClassSeriesAuthoringService(new ClassScheduleGenerationService())
}

async function setupValidAuthoringContext() {
  const manager = await UserFactory.apply('completed').create()
  const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
  await joinSchool(manager, school, RoleName.ADMINISTRATOR)

  const instructor = await UserFactory.apply('completed').create()
  const instructorMembership = await joinSchool(instructor, school, RoleName.TEACHER)
  const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
  const level = await LevelFactory.merge({ programId: program.id, capacity: 8 }).create()
  const skill = await SkillFactory.merge({ schoolId: school.id, name: 'Streamline' }).create()

  const data: StoreSwimmingClassInput = {
    levelId: level.id,
    code: 'UNIT-101',
    name: 'Unit Test Class',
    startDate: DateTime.fromISO('2026-08-01'),
    endDate: DateTime.fromISO('2026-08-01'),
    weekdays: [6],
    startTime: '09:00',
    endTime: '10:00',
    capacity: 8,
    location: 'Main Pool',
    instructorMode: 'existing',
    instructorMembershipId: instructorMembership.id,
    stages: [
      {
        name: 'Water confidence',
        position: 1,
        skillIds: [skill.id],
        newSkills: [],
      },
    ],
  }

  return { manager, school, instructorMembership, level, skill, data }
}

test.group('Class series authoring service', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('unavailable levels cannot be used for class creation', async ({ assert }) => {
    const { manager, school, level, data } = await setupValidAuthoringContext()
    await SchoolLevelSetting.create({
      schoolId: school.id,
      levelId: level.id,
      available: false,
    })

    await expectAuthoringError(
      assert,
      () => authoringService().create(school, manager, data),
      'This program level is not available for this school.'
    )
  })

  test('draft program levels cannot be used for class creation', async ({ assert }) => {
    const { manager, school, data } = await setupValidAuthoringContext()
    const draftProgram = await ProgramFactory.apply('draft').create()
    const draftLevel = await LevelFactory.merge({ programId: draftProgram.id, capacity: 8 }).create()

    await expectAuthoringError(
      assert,
      () => authoringService().create(school, manager, { ...data, levelId: draftLevel.id }),
      'This program is not yet active.'
    )
  })

  test('existing instructors must be eligible active-school members', async ({ assert }) => {
    const { manager, school, data } = await setupValidAuthoringContext()
    const parent = await UserFactory.apply('completed').create()
    const parentMembership = await joinSchool(parent, school, RoleName.PARENT)

    await expectAuthoringError(
      assert,
      () =>
        authoringService().create(school, manager, {
          ...data,
          instructorMembershipId: parentMembership.id,
        }),
      'Choose a Teacher or Head Coach from this school.'
    )
  })

  test('every class must keep at least one stage with at least one skill')
    .with([
      { stages: [], label: 'no stages' },
      {
        stages: [{ name: 'Empty stage', position: 1, skillIds: [], newSkills: [] }],
        label: 'empty stage',
      },
    ])
    .run(async ({ assert }, row) => {
      const { manager, school, data } = await setupValidAuthoringContext()

      await expectAuthoringError(
        assert,
        () =>
          authoringService().create(school, manager, {
            ...data,
            stages: row.stages,
          }),
        'Every class needs at least one stage with at least one skill.'
      )
    })

  test('submitted skill ids must be available to the active school', async ({ assert }) => {
    const { manager, school, data } = await setupValidAuthoringContext()
    const otherSchool = await SchoolFactory.create()
    const otherSkill = await SkillFactory.merge({
      schoolId: otherSchool.id,
      name: 'Other skill',
    }).create()

    await expectAuthoringError(
      assert,
      () =>
        authoringService().create(school, manager, {
          ...data,
          stages: [
            { name: 'Water confidence', position: 1, skillIds: [otherSkill.id], newSkills: [] },
          ],
        }),
      'A selected skill is not available to this school.'
    )
  })

  test('class meeting times must end after they start', async ({ assert }) => {
    const { manager, school, data } = await setupValidAuthoringContext()

    await expectAuthoringError(
      assert,
      () =>
        authoringService().create(school, manager, {
          ...data,
          startTime: '10:00',
          endTime: '09:00',
        }),
      'Class end time must be after the start time.'
    )
  })
})
