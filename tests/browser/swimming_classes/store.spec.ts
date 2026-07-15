import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { seedRoles, joinSchool, seedCurriculum } from '#tests/helpers'
import { RoleName } from '#values/role'
import type User from '#models/user'

async function manager(): Promise<User> {
  const user = await UserFactory.apply('completed').create()
  const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
  await joinSchool(user, school, RoleName.ADMINISTRATOR)
  return user
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
    await browserContext.loginAs(await manager())
    await seedCurriculum()

    const page = await visit(route('programs.index'))
    await page.getByRole('button', { name: 'Create class' }).click()

    await page.getByLabel('Base class name').fill('Evening squad')

    // Pick the curriculum for Monday: the seeded skill and its drill.
    await page.getByLabel('Select skills').first().click()
    await page.getByRole('option', { name: 'Hip rotation' }).click()
    await page.keyboard.press('Escape')
    await page.getByLabel('Hip rotation', { exact: true }).first().click()
    await page.getByRole('option', { name: 'Standing twists' }).click()
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
    await db.assertCount('class_skills', 1)
    await db.assertCount('class_activities', 1)
  })

  test('a single day creates a single class', async ({ visit, route, browserContext, db }) => {
    await browserContext.loginAs(await manager())
    await seedCurriculum()

    const page = await visit(route('programs.index'))
    await page.getByRole('button', { name: 'Create class' }).click()
    await page.getByLabel('Base class name').fill('Morning starfish')
    await page.getByRole('button', { name: 'Create 1 class' }).click()

    await page.assertPath(route('programs.index'))
    await page.assertVisible('text=Class created.')
    await db.assertHas('swimming_classes', {
      name: 'Morning starfish — Monday',
      code: 'ST01CL01',
      weekday: 1,
    })
  })

  test('duplicate class names across days are rejected', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    await browserContext.loginAs(await manager())
    await seedCurriculum()

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
