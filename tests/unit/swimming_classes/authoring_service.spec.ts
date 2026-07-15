import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { LevelFactory } from '#database/factories/level_factory'
import SchoolLevelSetting from '#models/school_level_setting'
import LevelStage from '#models/level_stage'
import LevelStageActivity from '#models/level_stage_activity'
import LevelStageSkill from '#models/level_stage_skill'
import ClassSeriesAuthoringService from '#services/class_series_authoring_service'
import type { StoreSwimmingClassesInput } from '#validators/swimming_class'
import { seedRoles, joinSchool, seedCurriculum } from '#tests/helpers'
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

async function setupContext() {
  const manager = await UserFactory.apply('completed').create()
  const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
  await joinSchool(manager, school, RoleName.ADMINISTRATOR)
  const curriculum = await seedCurriculum()

  const day = (
    overrides: Partial<StoreSwimmingClassesInput['days'][number]> = {}
  ): StoreSwimmingClassesInput['days'][number] => ({
    weekday: 1,
    startTime: '17:00',
    durationMinutes: 45,
    name: 'Evening squad — Monday',
    code: 'AQT-1001',
    levelStageId: curriculum.stage.id,
    skillIds: [curriculum.skill.id],
    activityIds: [curriculum.activity.id],
    ...overrides,
  })

  return { manager, school, ...curriculum, day }
}

test.group('Class series authoring service', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('creates one class per day with its curriculum', async ({ assert }) => {
    const { school, level, stage, skill, activity, day } = await setupContext()

    const classes = await new ClassSeriesAuthoringService().createMany(school, {
      levelId: level.id,
      days: [day(), day({ weekday: 3, name: 'Evening squad — Wednesday', code: 'AQT-1002' })],
    })

    assert.equal(classes.length, 2)
    assert.equal(classes[0].levelStageId, stage.id)
    await classes[0].load('classSkills')
    await classes[0].load('classActivities')
    assert.equal(classes[0].classSkills[0].levelStageSkillId, skill.id)
    assert.equal(classes[0].classActivities[0].levelStageActivityId, activity.id)
  })

  test('draft program levels cannot be used for class creation', async ({ assert }) => {
    const { school, day } = await setupContext()
    const draftProgram = await ProgramFactory.apply('draft').create()
    const draftLevel = await LevelFactory.merge({ programId: draftProgram.id }).create()
    const draftStage = await LevelStage.create({
      levelId: draftLevel.id,
      name: 'Draft Stage',
      position: 1,
      description: null,
    })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createMany(school, {
          levelId: draftLevel.id,
          days: [day({ levelStageId: draftStage.id })],
        }),
      'This program is not yet active.'
    )
  })

  test('unavailable levels cannot be used for class creation', async ({ assert }) => {
    const { school, level, day } = await setupContext()
    await SchoolLevelSetting.create({ schoolId: school.id, levelId: level.id, available: false })

    await expectAuthoringError(
      assert,
      () => new ClassSeriesAuthoringService().createMany(school, { levelId: level.id, days: [day()] }),
      'This program level is not available for this school.'
    )
  })

  test('the stage must belong to the selected level', async ({ assert }) => {
    const { school, level, day } = await setupContext()
    const otherCurriculum = await seedCurriculum({
      program: 'Other Program',
      level: 'Other Level',
    })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createMany(school, {
          levelId: level.id,
          days: [day({ levelStageId: otherCurriculum.stage.id })],
        }),
      'Choose a stage from this level.'
    )
  })

  test('skills must belong to the selected stage', async ({ assert }) => {
    const { school, level, stage, day } = await setupContext()
    const otherStage = await LevelStage.create({
      levelId: level.id,
      name: 'Other Stage',
      position: 2,
      description: null,
    })
    const foreignSkill = await LevelStageSkill.create({
      levelStageId: otherStage.id,
      name: 'Foreign Skill',
      passCriteria: 'n/a',
      description: null,
    })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createMany(school, {
          levelId: level.id,
          days: [day({ levelStageId: stage.id, skillIds: [foreignSkill.id], activityIds: [] })],
        }),
      'A selected skill does not belong to this stage.'
    )
  })

  test('activities must belong to the selected skills', async ({ assert }) => {
    const { school, level, stage, skill, day } = await setupContext()
    const otherSkill = await LevelStageSkill.create({
      levelStageId: stage.id,
      name: 'Unselected Skill',
      passCriteria: 'n/a',
      description: null,
    })
    const foreignActivity = await LevelStageActivity.create({
      levelStageSkillId: otherSkill.id,
      name: 'Foreign Drill',
      description: null,
      applicationNotes: null,
    })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createMany(school, {
          levelId: level.id,
          days: [day({ skillIds: [skill.id], activityIds: [foreignActivity.id] })],
        }),
      'A selected activity does not belong to the selected skills.'
    )
  })

  test('duplicate names within a payload are rejected', async ({ assert }) => {
    const { school, level, day } = await setupContext()

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createMany(school, {
          levelId: level.id,
          days: [
            day({ name: 'Same Name', code: 'AQT-1' }),
            day({ weekday: 2, name: 'same name', code: 'AQT-2' }),
          ],
        }),
      'A class with this name already exists.'
    )
  })

  test('existing class codes in the school are rejected', async ({ assert }) => {
    const { school, level, day } = await setupContext()
    await new ClassSeriesAuthoringService().createMany(school, {
      levelId: level.id,
      days: [day({ code: 'AQT-TAKEN' })],
    })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createMany(school, {
          levelId: level.id,
          days: [day({ weekday: 4, name: 'Another Name', code: 'aqt-taken' })],
        }),
      'A class with this code already exists.'
    )
  })
})
