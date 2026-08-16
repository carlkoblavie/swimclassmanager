import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { SwimmingClassFactory } from '#database/factories/swimming_class_factory'
import ClassLesson from '#models/class_lesson'
import ClassSkill from '#models/class_skill'
import LessonActivity from '#models/lesson_activity'
import { seedRoles, joinSchool, seedCurriculum, seedBankSkill } from '#tests/helpers'
import { LessonActivityLeader } from '#values/lesson_activity_leader'
import { RoleName } from '#values/role'

async function setupClass() {
  const user = await UserFactory.apply('completed').create()
  const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
  await joinSchool(user, school, RoleName.ADMINISTRATOR)
  const curriculum = await seedCurriculum()
  const bankSkill = await seedBankSkill(school.id, curriculum.skill)
  const swimmingClass = await SwimmingClassFactory.merge({
    schoolId: school.id,
    levelId: curriculum.level.id,
    levelStageId: curriculum.stage.id,
  }).create()
  await ClassSkill.create({
    swimmingClassId: swimmingClass.id,
    skillBankSkillId: bankSkill.id,
    levelStageSkillId: curriculum.skill.id,
  })
  return { user, school, swimmingClass, ...curriculum }
}

test.group('Class lessons', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('copies activities into selected empty lessons', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const { user, swimmingClass, activity } = await setupClass()
    const sourceLesson = await ClassLesson.create({
      swimmingClassId: swimmingClass.id,
      date: DateTime.fromISO('2026-07-13'),
    })
    const emptyLesson = await ClassLesson.create({
      swimmingClassId: swimmingClass.id,
      date: DateTime.fromISO('2026-07-20'),
    })
    const occupiedLesson = await ClassLesson.create({
      swimmingClassId: swimmingClass.id,
      date: DateTime.fromISO('2026-07-27'),
    })
    await LessonActivity.create({
      classLessonId: sourceLesson.id,
      levelStageActivityId: activity.id,
      activityName: activity.name,
      categoryName: 'Core Skills',
      activityDescription: 'Rotate smoothly through the movement.',
      successCue: 'Smooth circles both directions',
      durationMinutes: 12,
      ledBy: LessonActivityLeader.MIXED,
      position: 1,
    })
    await LessonActivity.create({
      classLessonId: occupiedLesson.id,
      levelStageActivityId: activity.id,
      position: 1,
    })
    await browserContext.loginAs(user)

    const page = await visit(`${route('lessons.index')}?classId=${swimmingClass.id}`)

    await page.getByRole('button', { name: 'Copy activities from Monday 13 Jul 2026' }).click()
    await page.assertVisible('text=Copy 1 activity into other lessons')
    await page.assertVisible(page.getByText('Empty', { exact: true }))
    await page.assertNotExists('text=Monday 27 Jul 2026')
    await page.assertElementsCount('input[type="checkbox"]', 1)
    await page.getByRole('checkbox').first().check()
    await page.getByRole('button', { name: 'Copy activities', exact: true }).click()

    await page.assertVisible('text=Activities copied into 1 lesson.')
    await page.assertNotExists('text=Copy 1 activity into other lessons')
    await db.assertHas('lesson_activities', {
      class_lesson_id: emptyLesson.id,
      level_stage_activity_id: activity.id,
      activity_name: activity.name,
      category_name: 'Core Skills',
      activity_description: 'Rotate smoothly through the movement.',
      success_cue: 'Smooth circles both directions',
      duration_minutes: 12,
      led_by: LessonActivityLeader.MIXED,
      position: 1,
    })
  })

  test('a manager plans a lesson with its activities', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const { user, swimmingClass } = await setupClass()
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.assertVisible('text=Stage skills')
    await page.assertVisible('text=Hip rotation')
    await page.assertVisible('text=Pass: Smooth circles both directions')
    await page.getByLabel('Lesson objectives').fill('Practise a calm float and safe recovery.')
    await page.getByRole('button', { name: 'Add to Warm Up' }).click()
    await page.getByRole('button', { name: 'Add', exact: true }).first().click()
    await page.getByRole('button', { name: 'Add again' }).first().click()
    await page.keyboard.press('Escape')
    await page.getByRole('spinbutton').first().fill('0')
    await page.getByLabel('Lesson notes (optional)').fill('Focus on slow, relaxed rotation.')
    await page.getByRole('button', { name: 'Plan next lesson' }).click()

    await page.assertVisible('text=Lesson planned.')
    const plannedLesson = await ClassLesson.query()
      .where('swimmingClassId', swimmingClass.id)
      .orderBy('id', 'desc')
      .firstOrFail()
    await page.assertPath(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.assertQueryString({ lessonId: String(plannedLesson.id) })
    await page.assertVisible('text=Focus on slow, relaxed rotation.')
    await db.assertHas('class_lessons', {
      swimming_class_id: swimmingClass.id,
      objectives: 'Practise a calm float and safe recovery.',
      notes: 'Focus on slow, relaxed rotation.',
    })
    await db.assertHas('lesson_activities', {
      duration_minutes: 1,
      led_by: LessonActivityLeader.MIXED,
    })
    await db.assertCount('lesson_activities', 2)
  })

  test('a manager plans from stage skills when a class has no explicit skill selection', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.ADMINISTRATOR)
    const { level, stage } = await seedCurriculum()
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      levelId: level.id,
      levelStageId: stage.id,
    }).create()
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.assertVisible('text=Stage skills')
    await page.assertVisible('text=Hip rotation')
    await page.getByLabel('Lesson objectives').fill('Plan from the selected stage skills.')
    await page.getByRole('button', { name: 'Add to Core Skills' }).click()
    await page.getByRole('button', { name: 'Add', exact: true }).first().click()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Plan next lesson' }).click()

    await page.assertVisible('text=Lesson planned.')
    await db.assertHas('class_lessons', {
      swimming_class_id: swimmingClass.id,
      objectives: 'Plan from the selected stage skills.',
    })
    await db.assertHas('lesson_activities', {
      activity_name: 'Standing twists',
    })
  })

  test('a manager creates a custom activity from the lesson drawer', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const { user, school, swimmingClass } = await setupClass()
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.getByLabel('Lesson objectives').fill('Practise a custom balance activity.')
    await page.getByRole('button', { name: 'Add to Warm Up' }).click()
    await page.getByRole('button', { name: 'Add custom activity' }).click()
    await page.getByLabel('Activity name').fill('Wall balance float')
    await page.getByLabel('Custom activity duration minutes').fill('7')
    await page.getByRole('button', { name: 'Add activity' }).click()
    await page.assertVisible(page.getByText('Wall balance float', { exact: true }))
    await page.getByRole('button', { name: 'Plan next lesson' }).click()

    await page.assertVisible('text=Lesson planned.')
    await db.assertHas('school_activities', {
      school_id: school.id,
      name: 'Wall balance float',
      duration_minutes: 7,
      source_type: 'school',
    })
    await db.assertHas('lesson_activities', {
      activity_name: 'Wall balance float',
      duration_minutes: 7,
    })
  })

  test('lesson dates append sequentially on the class day', async ({
    visit,
    route,
    browserContext,
    db,
    assert,
  }) => {
    const { user, swimmingClass } = await setupClass()
    // Anchor an existing future Monday lesson; the next plan lands 7 days on.
    let anchor = DateTime.now().startOf('day').plus({ days: 1 })
    while (anchor.weekday !== 1) {
      anchor = anchor.plus({ days: 1 })
    }
    await ClassLesson.create({ swimmingClassId: swimmingClass.id, date: anchor })
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.getByLabel('Lesson objectives').fill('Build on the previous Monday lesson.')
    await page.getByRole('button', { name: 'Plan next lesson' }).click()

    await page.assertVisible('text=Lesson planned.')
    await db.assertCount('class_lessons', 2)
    const lessons = await ClassLesson.query()
      .where('swimmingClassId', swimmingClass.id)
      .orderBy('date')
    assert.equal(lessons[1].date.toISODate(), anchor.plus({ days: 7 }).toISODate())
  })

  test('lesson numbers continue across month groups', async ({ visit, route, browserContext }) => {
    const { user, swimmingClass } = await setupClass()
    await ClassLesson.create({
      swimmingClassId: swimmingClass.id,
      date: DateTime.fromISO('2026-06-29'),
    })
    await ClassLesson.create({
      swimmingClassId: swimmingClass.id,
      date: DateTime.fromISO('2026-07-06'),
    })
    await browserContext.loginAs(user)

    const page = await visit(`${route('lessons.index')}?classId=${swimmingClass.id}`)

    await page.assertVisible(page.getByText('02', { exact: true }))
  })

  test('keeps planned lessons available from the lessons page', async ({
    visit,
    route,
    browserContext,
  }) => {
    const { user, swimmingClass, activity } = await setupClass()
    const lesson = await ClassLesson.create({
      swimmingClassId: swimmingClass.id,
      date: DateTime.fromISO('2026-07-13'),
    })
    await LessonActivity.create({ classLessonId: lesson.id, levelStageActivityId: activity.id })
    await browserContext.loginAs(user)

    const page = await visit(`${route('lessons.index')}?classId=${swimmingClass.id}`)

    await page.assertVisible(page.getByRole('button', { name: 'View lesson', exact: true }))
    await page.assertNotExists('text=1 activity')
  })

  test('applies date and activity filters to the lesson list', async ({
    visit,
    route,
    browserContext,
  }) => {
    const { user, swimmingClass, activity } = await setupClass()
    const plannedLesson = await ClassLesson.create({
      swimmingClassId: swimmingClass.id,
      date: DateTime.fromISO('2026-07-13'),
    })
    await LessonActivity.create({
      classLessonId: plannedLesson.id,
      levelStageActivityId: activity.id,
    })
    await ClassLesson.create({
      swimmingClassId: swimmingClass.id,
      date: DateTime.fromISO('2026-08-10'),
    })
    await browserContext.loginAs(user)

    const page = await visit(route('lessons.index'))
    await page.assertVisible('text=Monday 10 Aug')
    await page.assertNotExists(page.getByRole('button', { name: 'Generate lessons' }))
    await page.getByLabel('From date').fill('2026-08-01')
    await page.getByLabel('To date').fill('2026-08-31')
    await page.getByLabel('Activity status').selectOption('without-activities')
    await page.getByRole('button', { name: 'Apply filters' }).click()

    await page.assertVisible('text=Monday 10 Aug')
    await page.assertNotExists('text=Monday 13 Jul')
  })

  test('opens lesson generation from a class context', async ({ visit, route, browserContext }) => {
    const { user, swimmingClass } = await setupClass()
    await browserContext.loginAs(user)

    const page = await visit(`${route('lessons.index')}?classId=${swimmingClass.id}&generate=1`)

    await page.assertVisible(page.getByText('Date range', { exact: true }))
    await page.assertVisible(page.getByRole('button', { name: 'Generate lessons' }))
  })

  test('a manager edits a lesson to add activities and notes', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const { user, swimmingClass } = await setupClass()
    // The first lesson is created with the class and starts empty.
    await ClassLesson.create({
      swimmingClassId: swimmingClass.id,
      date: DateTime.fromISO('2026-07-13'),
    })
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.getByRole('button', { name: 'Edit lesson Monday 13 Jul 2026' }).click()
    await page.assertVisible(page.getByText('#1', { exact: true }))
    await page.assertVisible(page.getByText('Stage skills').first())
    await page.assertNotExists(page.getByRole('button', { name: 'Plan next lesson' }))
    await page.assertVisible(page.getByText('Hip rotation').first())
    await page.assertVisible('text=Pass')
    await page.assertVisible('text=Smooth circles both directions')
    await page.getByLabel('Lesson objectives').first().fill('Recover to the wall after floating.')
    await page.getByRole('button', { name: 'Add to Warm Up' }).first().click()
    await page.getByRole('button', { name: 'Add', exact: true }).first().click()
    await page.keyboard.press('Escape')
    await page.getByRole('spinbutton').first().fill('11')
    await page.getByLabel('Lesson notes (optional)').first().fill('Added after creation.')
    await page.getByLabel('Conclude this lesson').check()
    await page.getByLabel('Lesson observation').fill('Learners recovered calmly after each float.')
    await page.getByRole('button', { name: 'Save lesson' }).click()

    await page.assertVisible('text=Lesson updated.')
    await page.assertVisible(page.getByText('Learners recovered calmly after each float.').first())
    await db.assertHas('class_lessons', {
      swimming_class_id: swimmingClass.id,
      objectives: 'Recover to the wall after floating.',
      notes: 'Added after creation.',
      observation: 'Learners recovered calmly after each float.',
    })
    await db.assertHas('lesson_activities', { duration_minutes: 11 })
  })

  test('a manager removes a planned lesson', async ({ visit, route, browserContext, db }) => {
    const { user, swimmingClass } = await setupClass()
    const lesson = await ClassLesson.create({
      swimmingClassId: swimmingClass.id,
      date: DateTime.fromISO('2026-07-13'),
    })
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.getByRole('button', { name: `Remove lesson Monday 13 Jul 2026` }).click()

    await page.assertVisible('text=Lesson removed.')
    await db.assertMissing('class_lessons', { id: lesson.id })
  })

  test('non-managers see lessons but no planning form', async ({
    visit,
    route,
    browserContext,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.PARENT)
    const { level, stage } = await seedCurriculum()
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      levelId: level.id,
      levelStageId: stage.id,
    }).create()
    await ClassLesson.create({
      swimmingClassId: swimmingClass.id,
      date: DateTime.fromISO('2026-07-13'),
    })
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))

    await page.assertVisible('text=Monday 13 Jul 2026')
    await page.assertNotExists(page.getByRole('button', { name: 'Plan next lesson' }))
  })
})
