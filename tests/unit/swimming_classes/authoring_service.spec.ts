import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { LevelFactory } from '#database/factories/level_factory'
import ClassInstructor from '#models/class_instructor'
import Invitation from '#models/invitation'
import Role from '#models/role'
import SchoolLevelSetting from '#models/school_level_setting'
import SwimYear from '#models/swim_year'
import LevelStage from '#models/level_stage'
import LevelStageActivity from '#models/level_stage_activity'
import LevelStageSkill from '#models/level_stage_skill'
import SchoolActivity from '#models/school_activity'
import ClassSeriesAuthoringService from '#services/class_series_authoring_service'
import SchoolActivityBankService from '#services/school_activity_bank_service'
import type { StoreSwimmingClassesInput } from '#validators/swimming_class'
import { seedRoles, joinSchool, seedCurriculum } from '#tests/helpers'
import { ClassInstructorRole } from '#values/class_instructor_role'
import { LessonActivityLeader } from '#values/lesson_activity_leader'
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

  const swimYear = await SwimYear.create({
    schoolId: school.id,
    name: '2026',
    startsOn: DateTime.fromISO('2026-01-01'),
    endsOn: DateTime.fromISO('2026-12-31'),
  })
  const term = await swimYear.related('terms').create({
    name: 'Term 1',
    position: 1,
    startsOn: DateTime.fromISO('2026-01-01'),
    endsOn: DateTime.fromISO('2026-12-31'),
  })

  const day = (
    overrides: Partial<StoreSwimmingClassesInput['days'][number]> = {}
  ): StoreSwimmingClassesInput['days'][number] => ({
    weekday: 1,
    startTime: '17:00',
    durationMinutes: 45,
    name: 'Evening squad — Monday',
    lessonDate: DateTime.fromISO('2026-07-13'),
    levelStageId: curriculum.stage.id,
    skillIds: [curriculum.skill.id],
    ...overrides,
  })

  return { manager, school, ...curriculum, term, day }
}

test.group('Class series authoring service', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('creates one class per day with its curriculum', async ({ assert }) => {
    const { school, level, stage, skill, term, day } = await setupContext()

    const classes = await new ClassSeriesAuthoringService().createMany(school, {
      levelId: level.id,
      termId: term.id,
      days: [
        day(),
        day({
          weekday: 3,
          name: 'Evening squad — Wednesday',
          lessonDate: DateTime.fromISO('2026-07-15'),
        }),
      ],
    })

    assert.equal(classes.length, 2)
    // Codes derive from the stage segment with platform-continuous numbers.
    assert.equal(classes[0].code, 'ST01CL01')
    assert.equal(classes[1].code, 'ST01CL02')
    assert.equal(classes[0].levelStageId, stage.id)
    await classes[0].load('classSkills')
    assert.equal(classes[0].classSkills[0].levelStageSkillId, skill.id)
    await classes[0].load('lessons')
    assert.equal(classes[0].lessons[0].date.toISODate(), '2026-07-13')
  })

  test('draft program levels cannot be used for class creation', async ({ assert }) => {
    const { school, term, day } = await setupContext()
    const draftProgram = await ProgramFactory.apply('draft').create()
    const draftLevel = await LevelFactory.merge({ programId: draftProgram.id }).create()
    const draftStage = await LevelStage.create({
      code: 'L90ST905',
      levelId: draftLevel.id,
      name: 'Draft Stage',
      position: 1,
      classesCount: 10,
      description: null,
    })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createMany(school, {
          levelId: draftLevel.id,
          termId: term.id,
          days: [day({ levelStageId: draftStage.id })],
        }),
      'This program is not yet active.'
    )
  })

  test('unavailable levels cannot be used for class creation', async ({ assert }) => {
    const { school, level, term, day } = await setupContext()
    await SchoolLevelSetting.create({ schoolId: school.id, levelId: level.id, available: false })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createMany(school, {
          levelId: level.id,
          termId: term.id,
          days: [day()],
        }),
      'This program level is not available for this school.'
    )
  })

  test('the stage must belong to the selected level', async ({ assert }) => {
    const { school, level, term, day } = await setupContext()
    const otherCurriculum = await seedCurriculum({
      program: 'Other Program',
      level: 'Other Level',
    })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createMany(school, {
          levelId: level.id,
          termId: term.id,
          days: [day({ levelStageId: otherCurriculum.stage.id })],
        }),
      'Choose a stage from this level.'
    )
  })

  test('skills must belong to the selected stage', async ({ assert }) => {
    const { school, level, stage, term, day } = await setupContext()
    const otherStage = await LevelStage.create({
      code: 'L90ST906',
      levelId: level.id,
      name: 'Other Stage',
      position: 2,
      classesCount: 10,
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
          termId: term.id,
          days: [day({ levelStageId: stage.id, skillIds: [foreignSkill.id] })],
        }),
      'A selected skill does not belong to this stage.'
    )
  })

  test('lesson activities must belong to the class skills', async ({ assert }) => {
    const { school, level, stage, term, day } = await setupContext()
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
    const [created] = await new ClassSeriesAuthoringService().createMany(school, {
      levelId: level.id,
      termId: term.id,
      days: [day()],
    })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().planLesson(created, {
          objectives: 'Keep the selected activities within class skills.',
          activityIds: [foreignActivity.id],
        }),
      'A selected activity does not belong to the class skills.'
    )
  })

  test('duplicate names within a payload are rejected', async ({ assert }) => {
    const { school, level, term, day } = await setupContext()

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createMany(school, {
          levelId: level.id,
          termId: term.id,
          days: [day({ name: 'Same Name' }), day({ weekday: 2, name: 'same name' })],
        }),
      'A class with this name already exists.'
    )
  })

  test('the first lesson must fall on the class day', async ({ assert }) => {
    const { school, level, term, day } = await setupContext()

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createMany(school, {
          levelId: level.id,
          termId: term.id,
          // 2026-07-14 is a Tuesday; the class runs on Mondays.
          days: [day({ lessonDate: DateTime.fromISO('2026-07-14') })],
        }),
      'The first lesson must fall on the class day.'
    )
  })

  test('planned lessons append on the class weekday', async ({ assert }) => {
    const { school, level, term, day } = await setupContext()
    // Anchor the first lesson on the next Monday from now so appends are
    // deterministic regardless of when the test runs.
    let firstDate = DateTime.now().startOf('day').plus({ days: 1 })
    while (firstDate.weekday !== 1) {
      firstDate = firstDate.plus({ days: 1 })
    }
    const [created] = await new ClassSeriesAuthoringService().createMany(school, {
      levelId: level.id,
      termId: term.id,
      days: [day({ lessonDate: firstDate })],
    })

    const lesson = await new ClassSeriesAuthoringService().planLesson(created, {
      objectives: 'Build on the previous class day.',
    })

    assert.equal(lesson.date.toISODate(), firstDate.plus({ days: 7 }).toISODate())
  })

  test('school activity bank items can be planned with lesson objectives', async ({ assert }) => {
    const { school, level, term, day } = await setupContext()
    const [created] = await new ClassSeriesAuthoringService().createMany(school, {
      levelId: level.id,
      termId: term.id,
      days: [day()],
    })
    const bank = await new SchoolActivityBankService().forSchool(school.id)
    const activity = bank[0].activities[0]

    const lesson = await new ClassSeriesAuthoringService().planLesson(created, {
      objectives: 'Float calmly and return to the wall.',
      schoolActivityIds: [activity.id, activity.id],
      schoolActivityDurations: [9, 4],
      schoolActivityLedBys: [LessonActivityLeader.LEARNER, LessonActivityLeader.INSTRUCTOR],
    })
    await lesson.load('lessonActivities')

    assert.equal(lesson.objectives, 'Float calmly and return to the wall.')
    assert.equal(lesson.lessonActivities[0].schoolActivityId, activity.id)
    assert.equal(lesson.lessonActivities[0].activityName, activity.name)
    assert.equal(lesson.lessonActivities[0].categoryName, bank[0].name)
    assert.equal(lesson.lessonActivities[0].durationMinutes, 9)
    assert.equal(lesson.lessonActivities[0].ledBy, LessonActivityLeader.LEARNER)
    assert.equal(lesson.lessonActivities[1].schoolActivityId, activity.id)
    assert.equal(lesson.lessonActivities[1].durationMinutes, 4)
    assert.equal(lesson.lessonActivities[1].ledBy, LessonActivityLeader.INSTRUCTOR)
  })

  test('custom lesson activities are added to the school activity bank', async ({ assert }) => {
    const { school, level, term, day } = await setupContext()
    const [created] = await new ClassSeriesAuthoringService().createMany(school, {
      levelId: level.id,
      termId: term.id,
      days: [day()],
    })
    const bank = await new SchoolActivityBankService().forSchool(school.id)
    const category = bank[0]

    const lesson = await new ClassSeriesAuthoringService().planLesson(created, {
      objectives: 'Add a custom activity from the lesson planner.',
      customActivityNames: ['Wall balance float'],
      customActivityCategoryIds: [category.id],
      customActivityDurations: [7],
      customActivityLedBys: [LessonActivityLeader.INSTRUCTOR],
    })
    await lesson.load('lessonActivities')
    const activity = await SchoolActivity.findByOrFail('name', 'Wall balance float')

    assert.equal(activity.schoolId, school.id)
    assert.equal(activity.schoolActivityCategoryId, category.id)
    assert.equal(activity.durationMinutes, 7)
    assert.equal(lesson.lessonActivities[0].schoolActivityId, activity.id)
    assert.equal(lesson.lessonActivities[0].activityName, 'Wall balance float')
    assert.equal(lesson.lessonActivities[0].durationMinutes, 7)
  })

  test('selected skill curriculum activities are copied into scoped activity bank suggestions', async ({
    assert,
  }) => {
    const { school, level, term, day, skill, activity } = await setupContext()
    const [created] = await new ClassSeriesAuthoringService().createMany(school, {
      levelId: level.id,
      termId: term.id,
      days: [day()],
    })
    await created.load('classSkills', (classSkillQuery) =>
      classSkillQuery.preload('levelStageSkill', (skillQuery) => skillQuery.preload('activities'))
    )

    const bankService = new SchoolActivityBankService()
    const bank = await bankService.forSchool(
      school.id,
      bankService.scopeFromClassSkills(created.levelId, created.levelStageId, created.classSkills)
    )
    const coreSkills = bank.find((category) => category.name === 'Core Skills')
    const suggestedActivity = coreSkills?.activities.find(
      (candidate) => candidate.levelStageActivityId === activity.id
    )

    assert.exists(suggestedActivity)
    assert.equal(suggestedActivity?.name, 'Standing twists')
    assert.equal(suggestedActivity?.focusArea, skill.name)
    assert.equal(suggestedActivity?.levelId, level.id)
    assert.equal(suggestedActivity?.levelStageSkillId, skill.id)
    assert.equal(suggestedActivity?.levelStageActivityId, activity.id)
  })

  test('school activity bank items must match the class curriculum scope', async ({ assert }) => {
    const { school, level, term, day } = await setupContext()
    const [created] = await new ClassSeriesAuthoringService().createMany(school, {
      levelId: level.id,
      termId: term.id,
      days: [day()],
    })
    const bank = await new SchoolActivityBankService().forSchool(school.id)
    const category = bank[0]
    const otherCurriculum = await seedCurriculum({
      program: 'Adult Program',
      level: 'Adult Beginner',
      stage: 'Adult Stage',
      skill: 'Adult Treading',
      activity: 'Adult Deep Water Tread',
    })
    const adultActivity = await SchoolActivity.create({
      schoolId: school.id,
      schoolActivityCategoryId: category.id,
      levelId: otherCurriculum.level.id,
      levelStageId: otherCurriculum.stage.id,
      levelStageSkillId: otherCurriculum.skill.id,
      levelStageActivityId: otherCurriculum.activity.id,
      name: 'Adult-only treading drill',
      focusArea: 'Adult deep water safety',
      ledBy: LessonActivityLeader.INSTRUCTOR,
      description: 'A deep-water adult activity.',
      equipment: null,
      safetyNotes: null,
      successCue: 'Maintains a calm tread.',
      progressionEasier: null,
      progressionHarder: null,
      durationMinutes: 10,
      position: 99,
      isActive: true,
    })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().planLesson(created, {
          objectives: 'Keep activities in scope for this class.',
          schoolActivityIds: [adultActivity.id],
        }),
      'A selected activity bank item does not match this class curriculum.'
    )
  })

  test('class codes stay continuous across separate creations', async ({ assert }) => {
    const { school, level, term, day } = await setupContext()
    await new ClassSeriesAuthoringService().createMany(school, {
      levelId: level.id,
      termId: term.id,
      days: [day()],
    })

    const [second] = await new ClassSeriesAuthoringService().createMany(school, {
      levelId: level.id,
      termId: term.id,
      days: [
        day({
          weekday: 4,
          name: 'Another Name',
          lessonDate: DateTime.fromISO('2026-07-16'),
        }),
      ],
    })

    assert.equal(second.code, 'ST01CL02')
  })

  test('lesson dates must fall within the class term', async ({ assert }) => {
    const { school, level, day } = await setupContext()
    const otherYear = await SwimYear.create({
      schoolId: school.id,
      name: '2027',
      startsOn: DateTime.fromISO('2027-01-01'),
      endsOn: DateTime.fromISO('2027-12-31'),
    })
    const otherTerm = await otherYear.related('terms').create({
      name: 'Term 1',
      position: 1,
      startsOn: DateTime.fromISO('2027-01-04'),
      endsOn: DateTime.fromISO('2027-04-01'),
    })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createMany(school, {
          levelId: level.id,
          termId: otherTerm.id,
          days: [day()],
        }),
      'Lesson dates must fall within Term 1 (4 Jan 2027 – 1 Apr 2027).'
    )
  })

  test('the term must belong to the school', async ({ assert }) => {
    const { manager, school, level, day } = await setupContext()
    const otherSchool = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    const foreignYear = await SwimYear.create({
      schoolId: otherSchool.id,
      name: '2026',
      startsOn: DateTime.fromISO('2026-01-01'),
      endsOn: DateTime.fromISO('2026-12-31'),
    })
    const foreignTerm = await foreignYear.related('terms').create({
      name: 'Term 1',
      position: 1,
      startsOn: DateTime.fromISO('2026-01-01'),
      endsOn: DateTime.fromISO('2026-12-31'),
    })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createMany(school, {
          levelId: level.id,
          termId: foreignTerm.id,
          days: [day()],
        }),
      'Choose a term from one of this school’s swim years.'
    )
  })

  test('multiple instructors, including a pending invitee, can be assigned at creation', async ({
    assert,
  }) => {
    const { school, level, term, day } = await setupContext()
    const teacher = await UserFactory.apply('completed').create()
    const membership = await joinSchool(teacher, school, RoleName.TEACHER)
    const teacherRole = await Role.findByOrFail('name', RoleName.TEACHER)
    const invitation = await Invitation.create({
      schoolId: school.id,
      roleId: teacherRole.id,
      email: 'pending@example.com',
      inviteeFirstName: 'Pending',
      inviteeLastName: 'Coach',
      token: 'token-pending-coach',
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    const classes = await new ClassSeriesAuthoringService().createMany(school, {
      levelId: level.id,
      termId: term.id,
      leadInstructorMembershipId: membership.id,
      supportingInstructorInvitationIds: [invitation.id],
      days: [
        day(),
        day({
          weekday: 3,
          name: 'Evening squad — Wednesday',
          lessonDate: DateTime.fromISO('2026-07-15'),
        }),
      ],
    })

    for (const created of classes) {
      const rows = await ClassInstructor.query().where('swimmingClassId', created.id)
      assert.deepEqual(
        rows.map((row) => [row.membershipId, row.invitationId, row.role]).toSorted(),
        [
          [membership.id, null, ClassInstructorRole.LEAD],
          [null, invitation.id, ClassInstructorRole.SUPPORTING],
        ].toSorted()
      )
    }
  })

  test('a non-instructor membership is rejected at creation', async ({ assert }) => {
    const { school, level, term, day } = await setupContext()
    const parent = await UserFactory.apply('completed').create()
    const membership = await joinSchool(parent, school, RoleName.PARENT)

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createMany(school, {
          levelId: level.id,
          termId: term.id,
          instructorMembershipIds: [membership.id],
          days: [day()],
        }),
      'Choose Teachers or Head Coaches from this school.'
    )
  })

  test('an accepted invitation cannot be assigned as pending', async ({ assert }) => {
    const { school, level, term, day } = await setupContext()
    const teacherRole = await Role.findByOrFail('name', RoleName.TEACHER)
    const invitation = await Invitation.create({
      schoolId: school.id,
      roleId: teacherRole.id,
      email: 'accepted@example.com',
      token: 'token-accepted',
      expiresAt: DateTime.now().plus({ days: 7 }),
      acceptedAt: DateTime.now(),
    })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createMany(school, {
          levelId: level.id,
          termId: term.id,
          instructorInvitationIds: [invitation.id],
          days: [day()],
        }),
      'Choose pending Teacher invitations from this school.'
    )
  })

  test("lesson planning stops at the level's classes count", async ({ assert }) => {
    const { school, level, term, day } = await setupContext()
    level.merge({ classesCount: 1 })
    await level.save()

    // The first lesson is created with the class, filling the allowance.
    const [created] = await new ClassSeriesAuthoringService().createMany(school, {
      levelId: level.id,
      termId: term.id,
      days: [day()],
    })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().planLesson(created, {
          objectives: 'This should fail before creating another lesson.',
        }),
      'This class already has all 1 lesson its level allows.'
    )
  })
})
