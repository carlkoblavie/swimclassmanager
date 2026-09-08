import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { LevelFactory } from '#database/factories/level_factory'
import ClassInstructor from '#models/class_instructor'
import ClassLesson from '#models/class_lesson'
import LessonInstructor from '#models/lesson_instructor'
import LessonActivity from '#models/lesson_activity'
import Invitation from '#models/invitation'
import Role from '#models/role'
import SchoolLevelSetting from '#models/school_level_setting'
import SwimYear from '#models/swim_year'
import SwimmingClass from '#models/swimming_class'
import LevelStage from '#models/level_stage'
import LevelStageActivity from '#models/level_stage_activity'
import LevelStageSkill from '#models/level_stage_skill'
import SchoolActivity from '#models/school_activity'
import SkillBankSkill from '#models/skill_bank_skill'
import ClassSeriesAuthoringService from '#services/class_series_authoring_service'
import SchoolActivityBankService from '#services/school_activity_bank_service'
import type { StoreSwimmingClassesInput } from '#validators/swimming_class'
import { seedRoles, joinSchool, seedCurriculum } from '#tests/helpers'
import { ClassInstructorRole } from '#values/class_instructor_role'
import { LessonActivityLeader } from '#values/lesson_activity_leader'
import { RoleName } from '#values/role'
import { SkillBankFamilyKey } from '#values/skill_bank_family'

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
  const bankSkill = await SkillBankSkill.create({
    schoolId: school.id,
    sourceType: 'legacy',
    sourceKey: `level_stage_skill:${curriculum.skill.id}`,
    sourceVersion: null,
    family: SkillBankFamilyKey.WATER_COMFORT_ORIENTATION,
    name: curriculum.skill.name,
    description: curriculum.skill.description,
    passCriteria: curriculum.skill.passCriteria,
    position: 1,
    isActive: true,
    createdByUserId: null,
  })

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

  // A class is stage + skills + duration (+ optional name). No day or time.
  const classInput = (
    overrides: Partial<StoreSwimmingClassesInput> = {}
  ): Omit<StoreSwimmingClassesInput, 'levelId' | 'termId'> => ({
    levelStageId: curriculum.stage.id,
    skillIds: [bankSkill.id],
    durationMinutes: 45,
    maxLessons: 5,
    name: 'Evening squad',
    aim: 'Build confidence in the water.',
    assessmentGoals: ['Float unaided for 10 seconds.'],
    ...overrides,
  })

  // Classes are created without a schedule; simulate scheduling a class so the
  // (deferred) lesson planner can run against it.
  const scheduleClass = async (id: number): Promise<SwimmingClass> => {
    const scheduled = await SwimmingClass.findOrFail(id)
    scheduled.weekday = 1
    await scheduled.save()
    return scheduled
  }

  return { manager, school, ...curriculum, bankSkill, term, classInput, scheduleClass }
}

test.group('Class series authoring service', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('creates a class with its curriculum and no schedule or lessons', async ({ assert }) => {
    const { school, level, stage, skill, bankSkill, term, classInput } = await setupContext()

    const created = await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      ...classInput(),
    })

    assert.equal(created.code, 'ST01CL01')
    assert.equal(created.levelStageId, stage.id)
    assert.equal(created.weekday, null)
    assert.equal(created.startTime, null)
    assert.equal(created.durationMinutes, 45)
    assert.equal(created.aim, 'Build confidence in the water.')
    assert.equal(created.assessmentGoals, JSON.stringify(['Float unaided for 10 seconds.']))
    assert.equal(created.prerequisiteStageId, null)
    await created.load('classSkills')
    assert.equal(created.classSkills[0].skillBankSkillId, bankSkill.id)
    assert.equal(created.classSkills[0].levelStageSkillId, skill.id)
    await created.load('lessons')
    assert.equal(created.lessons.length, 0)
  })

  test('a class may be created without selected bank skills', async ({ assert }) => {
    const { school, level, term, classInput } = await setupContext()
    const created = await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      ...classInput({ skillIds: undefined }),
    })

    await created.load('classSkills')
    assert.equal(created.classSkills.length, 0)
  })

  test('generates a name from the level and stage when left blank', async ({ assert }) => {
    const { school, level, stage, term, classInput } = await setupContext()

    const created = await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      ...classInput({ name: undefined }),
    })

    assert.equal(created.name, `${level.name} · ${stage.name}`)
  })

  test('draft program levels cannot be used for class creation', async ({ assert }) => {
    const { school, term, classInput } = await setupContext()
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
        new ClassSeriesAuthoringService().createOne(school, {
          levelId: draftLevel.id,
          termId: term.id,
          ...classInput({ levelStageId: draftStage.id, skillIds: [] }),
        }),
      'This program is not yet active.'
    )
  })

  test('unavailable levels cannot be used for class creation', async ({ assert }) => {
    const { school, level, term, classInput } = await setupContext()
    await SchoolLevelSetting.create({ schoolId: school.id, levelId: level.id, available: false })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createOne(school, {
          levelId: level.id,
          termId: term.id,
          ...classInput(),
        }),
      'This program level is not available for this school.'
    )
  })

  test('the stage must belong to the selected level', async ({ assert }) => {
    const { school, level, term, classInput } = await setupContext()
    const otherCurriculum = await seedCurriculum({
      program: 'Other Program',
      level: 'Other Level',
    })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createOne(school, {
          levelId: level.id,
          termId: term.id,
          ...classInput({ levelStageId: otherCurriculum.stage.id, skillIds: [] }),
        }),
      'Choose a stage from this level.'
    )
  })

  test('selected skills must be available in the skill bank', async ({ assert }) => {
    const { school, level, stage, term, classInput } = await setupContext()
    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createOne(school, {
          levelId: level.id,
          termId: term.id,
          ...classInput({ levelStageId: stage.id, skillIds: [999_999] }),
        }),
      'A selected skill is not available in the skill bank.'
    )
  })

  test('a class name must be unique within the stage', async ({ assert }) => {
    const { school, level, term, classInput } = await setupContext()
    await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      ...classInput({ name: 'Same Name' }),
    })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createOne(school, {
          levelId: level.id,
          termId: term.id,
          ...classInput({ name: 'same name' }),
        }),
      'A class with this name already exists.'
    )
  })

  test('class codes stay continuous across separate creations', async ({ assert }) => {
    const { school, level, term, classInput } = await setupContext()
    await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      ...classInput({ name: 'First class' }),
    })

    const second = await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      ...classInput({ name: 'Second class' }),
    })

    assert.equal(second.code, 'ST01CL02')
  })

  test('the term must belong to the school', async ({ assert }) => {
    const { manager, school, level, classInput } = await setupContext()
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
        new ClassSeriesAuthoringService().createOne(school, {
          levelId: level.id,
          termId: foreignTerm.id,
          ...classInput(),
        }),
      'Choose a term from one of this school’s swim years.'
    )
  })

  test('multiple instructors, including a pending invitee, can be assigned at creation', async ({
    assert,
  }) => {
    const { school, level, term, classInput } = await setupContext()
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

    const created = await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      leadInstructorMembershipId: membership.id,
      supportingInstructorInvitationIds: [invitation.id],
      ...classInput(),
    })

    const rows = await ClassInstructor.query().where('swimmingClassId', created.id)
    assert.deepEqual(
      rows.map((row) => [row.membershipId, row.invitationId, row.role]).toSorted(),
      [
        [membership.id, null, ClassInstructorRole.LEAD],
        [null, invitation.id, ClassInstructorRole.SUPPORTING],
      ].toSorted()
    )
  })

  test('a non-instructor membership is rejected at creation', async ({ assert }) => {
    const { school, level, term, classInput } = await setupContext()
    const parent = await UserFactory.apply('completed').create()
    const membership = await joinSchool(parent, school, RoleName.PARENT)

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().createOne(school, {
          levelId: level.id,
          termId: term.id,
          instructorMembershipIds: [membership.id],
          ...classInput(),
        }),
      'Choose Teachers or Head Coaches from this school.'
    )
  })

  test('an accepted invitation cannot be assigned as pending', async ({ assert }) => {
    const { school, level, term, classInput } = await setupContext()
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
        new ClassSeriesAuthoringService().createOne(school, {
          levelId: level.id,
          termId: term.id,
          instructorInvitationIds: [invitation.id],
          ...classInput(),
        }),
      'Choose pending Teacher invitations from this school.'
    )
  })

  test('duplicating a class copies its stage, skills, and instructors', async ({ assert }) => {
    const { school, level, term, skill, bankSkill, classInput } = await setupContext()
    const teacher = await UserFactory.apply('completed').create()
    const membership = await joinSchool(teacher, school, RoleName.TEACHER)

    const created = await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      leadInstructorMembershipId: membership.id,
      ...classInput({ name: 'Squad Prep' }),
    })

    const copy = await new ClassSeriesAuthoringService().duplicate(created, school)

    assert.notEqual(copy.id, created.id)
    assert.equal(copy.levelStageId, created.levelStageId)
    assert.equal(copy.name, 'Squad Prep (copy)')
    assert.equal(copy.code, 'ST01CL02')
    await copy.load('classSkills')
    assert.equal(copy.classSkills[0].skillBankSkillId, bankSkill.id)
    assert.equal(copy.classSkills[0].levelStageSkillId, skill.id)
    const rows = await ClassInstructor.query().where('swimmingClassId', copy.id)
    assert.equal(rows.length, 1)
    assert.equal(rows[0].membershipId, membership.id)
    assert.equal(rows[0].role, ClassInstructorRole.LEAD)
  })

  test('lessons cannot be planned until a class is scheduled', async ({ assert }) => {
    const { school, level, term, classInput } = await setupContext()
    const created = await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      ...classInput(),
    })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().planLesson(created, {
          objectives: ['Cannot plan before the class has a schedule.'],
        }),
      'Set this class’s schedule before planning lessons.'
    )
  })

  test('generates empty lessons for selected weekdays without duplicating dates', async ({
    assert,
  }) => {
    const { school, level, term, classInput } = await setupContext()
    const created = await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      ...classInput(),
    })
    await ClassLesson.create({
      swimmingClassId: created.id,
      date: DateTime.fromISO('2026-09-15'),
      objectives: null,
      notes: null,
      observation: null,
      concludedAt: null,
    })

    const lessons = await new ClassSeriesAuthoringService().generateLessons(created, {
      classId: created.id,
      startDate: DateTime.fromISO('2026-09-14'),
      endDate: DateTime.fromISO('2026-09-21'),
      startTime: '17:00',
      weekdays: [1, 2],
    })

    assert.equal(lessons.length, 2)
    const scheduled = await SwimmingClass.findOrFail(created.id)
    assert.equal(scheduled.weekday, 1)
    assert.equal(scheduled.startTime, '17:00')
    const dates = (
      await ClassLesson.query().where('swimmingClassId', created.id).orderBy('date')
    ).map((lesson) => lesson.date.toISODate())
    assert.deepEqual(dates, ['2026-09-14', '2026-09-15', '2026-09-21'])
  })

  test('generated lessons inherit class instructors and support per-lesson overrides', async ({
    assert,
  }) => {
    const { school, level, term, classInput } = await setupContext()
    const leadUser = await UserFactory.apply('completed').create()
    const supportingUser = await UserFactory.apply('completed').create()
    const replacementUser = await UserFactory.apply('completed').create()
    const lead = await joinSchool(leadUser, school, RoleName.TEACHER)
    const supporting = await joinSchool(supportingUser, school, RoleName.TEACHER)
    const replacement = await joinSchool(replacementUser, school, RoleName.HEAD_COACH)

    const swimmingClass = await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      leadInstructorMembershipId: lead.id,
      supportingInstructorMembershipIds: [supporting.id],
      ...classInput({ name: 'Staffed squad' }),
    })

    const [lesson] = await new ClassSeriesAuthoringService().generateLessons(swimmingClass, {
      classId: swimmingClass.id,
      startDate: DateTime.fromISO('2026-09-14'),
      endDate: DateTime.fromISO('2026-09-14'),
      startTime: '17:00',
      weekdays: [1],
    })

    let assignments = await LessonInstructor.query()
      .where('classLessonId', lesson.id)
      .orderBy('role')
    assert.deepEqual(
      assignments.map((assignment) => [assignment.membershipId, assignment.role]),
      [
        [lead.id, ClassInstructorRole.LEAD],
        [supporting.id, ClassInstructorRole.SUPPORTING],
      ]
    )

    await new ClassSeriesAuthoringService().assignLessonInstructors(lesson, school, {
      date: DateTime.fromISO('2026-09-21'),
      durationMinutes: 30,
      leadInstructorMembershipId: replacement.id,
      supportingInstructorMembershipIds: [supporting.id],
    })

    await lesson.refresh()
    assert.equal(lesson.date.toISODate(), '2026-09-21')
    assert.equal(lesson.durationMinutes, 30)

    assignments = await LessonInstructor.query().where('classLessonId', lesson.id).orderBy('role')
    assert.deepEqual(
      assignments.map((assignment) => [assignment.membershipId, assignment.role]),
      [
        [replacement.id, ClassInstructorRole.LEAD],
        [supporting.id, ClassInstructorRole.SUPPORTING],
      ]
    )
  })

  test('bulk assignment applies a lead and supporting instructor team to lessons', async ({
    assert,
  }) => {
    const { school, level, term, classInput } = await setupContext()
    const leadUser = await UserFactory.apply('completed').create()
    const supportingUser = await UserFactory.apply('completed').create()
    const lead = await joinSchool(leadUser, school, RoleName.HEAD_COACH)
    const supporting = await joinSchool(supportingUser, school, RoleName.ASSISTANT_COACH)
    const swimmingClass = await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      ...classInput({ name: 'Bulk assignment squad' }),
    })
    const lessons = await ClassLesson.createMany([
      { swimmingClassId: swimmingClass.id, date: DateTime.fromISO('2026-09-14') },
      { swimmingClassId: swimmingClass.id, date: DateTime.fromISO('2026-09-21') },
    ])

    await new ClassSeriesAuthoringService().bulkAssignLessonInstructors(lessons, school, {
      leadInstructorMembershipId: lead.id,
      supportingInstructorMembershipIds: [supporting.id],
    })

    const assignments = await LessonInstructor.query().whereIn(
      'classLessonId',
      lessons.map((lesson) => lesson.id)
    )
    assert.equal(assignments.length, 4)
    assert.equal(assignments.filter((assignment) => assignment.membershipId === lead.id).length, 2)
    assert.equal(
      assignments.filter((assignment) => assignment.membershipId === supporting.id).length,
      2
    )
  })

  test('copying activities rejects lessons that are not empty', async ({ assert }) => {
    const { school, level, term, activity, classInput } = await setupContext()
    const created = await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      ...classInput(),
    })
    const source = await ClassLesson.create({
      swimmingClassId: created.id,
      date: DateTime.fromISO('2026-09-14'),
    })
    const target = await ClassLesson.create({
      swimmingClassId: created.id,
      date: DateTime.fromISO('2026-09-21'),
    })
    await LessonActivity.create({
      classLessonId: source.id,
      levelStageActivityId: activity.id,
      position: 1,
    })
    await LessonActivity.create({
      classLessonId: target.id,
      levelStageActivityId: activity.id,
      position: 1,
    })

    await expectAuthoringError(
      assert,
      () => new ClassSeriesAuthoringService().copyLessonActivities(source, [target.id]),
      'Activities can only be copied into empty lessons.'
    )
  })

  test('lesson activities must belong to the class skills', async ({ assert }) => {
    const { school, level, stage, term, classInput } = await setupContext()
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
    const created = await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      ...classInput(),
    })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().planLesson(created, {
          objectives: ['Keep the selected activities within class skills.'],
          activityIds: [foreignActivity.id],
        }),
      'A selected activity does not belong to the class skills.'
    )
  })

  test('school activity bank items can be planned with lesson objectives', async ({ assert }) => {
    const { school, level, term, classInput, scheduleClass } = await setupContext()
    const created = await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      ...classInput(),
    })
    const scheduled = await scheduleClass(created.id)
    const bank = await new SchoolActivityBankService().forSchool(school.id)
    const activity = bank[0].activities[0]

    const lesson = await new ClassSeriesAuthoringService().planLesson(scheduled, {
      objectives: ['Float calmly and return to the wall.'],
      equipment: ['Kickboards x6', 'Lane rope'],
      schoolActivityIds: [activity.id, activity.id],
      schoolActivityDurations: [9, 4],
      schoolActivityLedBys: [LessonActivityLeader.LEARNER, LessonActivityLeader.INSTRUCTOR],
    })
    await lesson.load('lessonActivities')

    assert.equal(lesson.objectives, 'Float calmly and return to the wall.')
    assert.equal(lesson.equipment, JSON.stringify(['Kickboards x6', 'Lane rope']))
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
    const { school, level, term, classInput, scheduleClass } = await setupContext()
    const created = await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      ...classInput(),
    })
    const scheduled = await scheduleClass(created.id)
    const bank = await new SchoolActivityBankService().forSchool(school.id)
    const category = bank[0]

    const lesson = await new ClassSeriesAuthoringService().planLesson(scheduled, {
      objectives: ['Add a custom activity from the lesson planner.'],
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
    const { school, level, term, classInput, skill, activity } = await setupContext()
    const created = await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      ...classInput(),
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
    const { school, level, term, classInput } = await setupContext()
    const created = await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      ...classInput(),
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
          objectives: ['Keep activities in scope for this class.'],
          schoolActivityIds: [adultActivity.id],
        }),
      'A selected activity bank item does not match this class curriculum.'
    )
  })

  test("lesson planning stops at the level's classes count", async ({ assert }) => {
    const { school, level, term, classInput, scheduleClass } = await setupContext()
    level.merge({ classesCount: 1 })
    await level.save()

    const created = await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      ...classInput(),
    })
    const scheduled = await scheduleClass(created.id)

    // First lesson fills the one-lesson allowance.
    await new ClassSeriesAuthoringService().planLesson(scheduled, {
      objectives: ['The single allowed lesson.'],
    })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().planLesson(scheduled, {
          objectives: ['This should fail before creating another lesson.'],
        }),
      'This level already has all 1 lesson it allows.'
    )
  })

  test('shares a level lesson allowance across classes', async ({ assert }) => {
    const { school, level, term, classInput, scheduleClass } = await setupContext()
    level.merge({ classesCount: 2 })
    await level.save()

    const first = await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      ...classInput({ name: 'Morning squad' }),
    })
    const second = await new ClassSeriesAuthoringService().createOne(school, {
      levelId: level.id,
      termId: term.id,
      ...classInput({ name: 'Evening squad' }),
    })
    const scheduledFirst = await scheduleClass(first.id)
    const scheduledSecond = await scheduleClass(second.id)

    await new ClassSeriesAuthoringService().planLesson(scheduledFirst, {
      objectives: ['First shared lesson.'],
    })
    await new ClassSeriesAuthoringService().planLesson(scheduledSecond, {
      objectives: ['Second shared lesson.'],
    })

    await expectAuthoringError(
      assert,
      () =>
        new ClassSeriesAuthoringService().planLesson(scheduledFirst, {
          objectives: ['This should exceed the level allowance.'],
        }),
      'This level already has all 2 lessons it allows.'
    )
  })
})
