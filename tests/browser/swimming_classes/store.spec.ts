import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { seedRoles, joinSchool, seedCurriculum, seedSwimYear } from '#tests/helpers'
import { ClassInstructorRole } from '#values/class_instructor_role'
import { RoleName } from '#values/role'
import type School from '#models/school'
import type User from '#models/user'

async function manager(): Promise<{ user: User; school: School }> {
  const user = await UserFactory.apply('completed').create()
  const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
  await joinSchool(user, school, RoleName.ADMINISTRATOR)
  return { user, school }
}

test.group('Swimming classes store', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('a manager creates one class per day from the inline builder', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const { user, school } = await manager()
    const teacher = await UserFactory.apply('completed').create()
    teacher.fullName = 'Coach Ama'
    await teacher.save()
    const teacherMembership = await joinSchool(teacher, school, RoleName.TEACHER)
    await browserContext.loginAs(user)
    await seedCurriculum()
    await seedSwimYear(school)

    const page = await visit(route('programs.index'))
    await page.getByRole('button', { name: 'Create class' }).click()

    await page.getByLabel('Base class name').fill('Evening squad')
    await page.getByRole('combobox', { name: 'Lead instructor' }).click()
    await page.getByRole('option', { name: /Coach Ama/ }).click()
    await page.keyboard.press('Escape')
    await page.getByLabel('Select skills').first().click({ force: true })
    await page.getByRole('option', { name: 'Hip rotation' }).click()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Add another day' }).click()

    await page.getByRole('button', { name: 'Create 2 classes' }).click()

    await page.assertPath(route('programs.index'))
    await page.assertVisible('text=2 classes created.')

    await db.assertHas('swimming_classes', {
      name: 'Evening squad — Monday',
      code: 'ST01CL01',
      weekday: 1,
      duration_minutes: 45,
    })
    await db.assertHas('swimming_classes', {
      name: 'Evening squad — Tuesday',
      code: 'ST01CL02',
      weekday: 2,
    })
    // Skills live on the class; each class starts with its first dated lesson.
    await db.assertCount('class_skills', 1)
    await db.assertCount('class_lessons', 2)
    await db.assertCount('class_instructors', 2)
    await db.assertHas('class_instructors', {
      membership_id: teacherMembership.id,
      role: ClassInstructorRole.LEAD,
    })
  })

  test('a single day creates a single class', async ({ visit, route, browserContext, db }) => {
    const { user, school } = await manager()
    await browserContext.loginAs(user)
    await seedCurriculum()
    await seedSwimYear(school)

    const page = await visit(route('programs.index'))
    await page.getByRole('button', { name: 'Create class' }).click()
    await page.getByLabel('Base class name').fill('Morning starfish')
    await page.getByRole('button', { name: 'Create 1 class' }).click()

    await page.assertPath(route('programs.index'))
    await page.assertVisible('text=Class created.')
    // The builder closes once the classes are created.
    await page.assertNotExists(page.getByLabel('Base class name'))
    await db.assertHas('swimming_classes', {
      name: 'Morning starfish — Monday',
      code: 'ST01CL01',
      weekday: 1,
    })
    await db.assertCount('class_lessons', 1)
  })

  test('duplicate class names across days are rejected', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const { user, school } = await manager()
    await browserContext.loginAs(user)
    await seedCurriculum()
    await seedSwimYear(school)

    const page = await visit(route('programs.index'))
    await page.getByRole('button', { name: 'Create class' }).click()
    await page.getByRole('button', { name: 'Add another day' }).click()
    // Force both days to the same name.
    await page.getByLabel('Class name', { exact: true }).nth(0).fill('Same Name')
    await page.getByLabel('Class name', { exact: true }).nth(1).fill('same name')
    await page.getByRole('button', { name: 'Create 2 classes' }).click()

    await page.assertVisible('text=A class with this name already exists.')
    await db.assertCount('swimming_classes', 0)
  })
})
