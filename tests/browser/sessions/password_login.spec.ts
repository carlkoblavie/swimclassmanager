import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import hash from '@adonisjs/core/services/hash'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { RoleName } from '#values/role'
import { joinSchool, seedRoles } from '#tests/helpers'

test.group('Password login', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('signs in a user with email and password', async ({ visit, route }) => {
    const user = await UserFactory.apply('completed')
      .merge({
        email: 'manager@example.com',
        password: 'correct-password',
        mustChangePassword: false,
      })
      .create()
    const school = await SchoolFactory.merge({
      name: 'Aqua Swim School',
      location: 'Accra',
      createdByUserId: user.id,
    }).create()
    await joinSchool(user, school, RoleName.ADMINISTRATOR)

    const page = await visit(route('sign_in_links.create'))
    await page.getByLabel('Email').fill('manager@example.com')
    await page.getByPlaceholder('Enter your password').fill('correct-password')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await page.assertPath(route('home'))
    await page.assertVisible(page.getByRole('heading', { name: 'Aqua Swim School' }))
  })

  test('forces a temporary-password user to change password before dashboard access', async ({
    visit,
    route,
    db,
    assert,
  }) => {
    const user = await UserFactory.apply('completed')
      .merge({
        email: 'new.manager@example.com',
        password: 'temporary-password',
        mustChangePassword: true,
      })
      .create()
    const school = await SchoolFactory.merge({
      name: 'Aqua Swim School',
      location: 'Accra',
      createdByUserId: user.id,
    }).create()
    await joinSchool(user, school, RoleName.ADMINISTRATOR)

    const page = await visit(route('sign_in_links.create'))
    await page.getByLabel('Email').fill('new.manager@example.com')
    await page.getByPlaceholder('Enter your password').fill('temporary-password')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await page.assertPath(route('account_passwords.edit'))
    await page.getByLabel('New password').fill('new-secure-password')
    await page.getByLabel('Confirm password').fill('new-secure-password')
    await page.getByRole('button', { name: 'Update password' }).click()

    await page.assertPath(route('home'))
    await db.assertHas('users', { id: user.id, must_change_password: false })

    await user.refresh()
    assert.isTrue(await hash.use().verify(user.password!, 'new-secure-password'))
  })
})
