import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { SwimmingClassFactory } from '#database/factories/swimming_class_factory'
import ClassLesson from '#models/class_lesson'
import ClassSkill from '#models/class_skill'
import { seedRoles, joinSchool, seedCurriculum } from '#tests/helpers'
import { RoleName } from '#values/role'

async function setupClass() {
  const user = await UserFactory.apply('completed').create()
  const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
  await joinSchool(user, school, RoleName.ADMINISTRATOR)
  const curriculum = await seedCurriculum()
  const swimmingClass = await SwimmingClassFactory.merge({
    schoolId: school.id,
    levelId: curriculum.level.id,
    levelStageId: curriculum.stage.id,
  }).create()
  await ClassSkill.create({
    swimmingClassId: swimmingClass.id,
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

  test('a manager plans a lesson with its activities', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const { user, swimmingClass } = await setupClass()
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.getByLabel('Hip rotation activities').first().click({ force: true })
    await page.getByRole('option', { name: 'Standing twists' }).click()
    await page.keyboard.press('Escape')
    await page.getByLabel('Lesson notes (optional)').fill('Focus on slow, relaxed rotation.')
    await page.getByRole('button', { name: 'Plan next lesson' }).click()

    await page.assertVisible('text=Lesson planned.')
    await page.assertVisible('text=Focus on slow, relaxed rotation.')
    await db.assertHas('class_lessons', {
      swimming_class_id: swimmingClass.id,
      notes: 'Focus on slow, relaxed rotation.',
    })
    await db.assertCount('lesson_activities', 1)
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
    await page.getByRole('button', { name: 'Plan next lesson' }).click()

    await page.assertVisible('text=Lesson planned.')
    await db.assertCount('class_lessons', 2)
    const lessons = await ClassLesson.query()
      .where('swimmingClassId', swimmingClass.id)
      .orderBy('date')
    assert.equal(lessons[1].date.toISODate(), anchor.plus({ days: 7 }).toISODate())
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
    await page.getByLabel('Hip rotation activities').first().click({ force: true })
    await page.getByRole('option', { name: 'Standing twists' }).click()
    await page.keyboard.press('Escape')
    await page.getByLabel('Lesson notes (optional)').first().fill('Added after creation.')
    await page.getByRole('button', { name: 'Save lesson' }).click()

    await page.assertVisible('text=Lesson updated.')
    await page.assertVisible(page.getByText('Standing twists').first())
    await db.assertHas('class_lessons', {
      swimming_class_id: swimmingClass.id,
      notes: 'Added after creation.',
    })
    await db.assertCount('lesson_activities', 1)
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
