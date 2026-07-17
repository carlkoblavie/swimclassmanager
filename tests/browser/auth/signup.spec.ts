import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Membership from '#models/membership'
import School from '#models/school'
import { UserFactory } from '#database/factories/user_factory'
import { RoleName } from '#values/role'
import { seedRoles } from '#tests/helpers'

test.group('Account registrations', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('creates an institution account, signs in the founder, and lands on the dashboard', async ({
    visit,
    route,
    db,
    assert,
  }) => {
    const page = await visit(route('account_registrations.create'))

    await page.getByLabel('First name').fill('Jane')
    await page.getByLabel('Last name').fill('Doe')
    await page.getByLabel('Institutional email').fill('jane@example.com')
    await page.getByLabel('Institution name').fill('Aqua Swim Organisation')
    await page.getByLabel('Location').fill('Accra')
    await page.getByLabel('I agree to create this institution workspace for my swim school.').check()
    await page.getByRole('button', { name: 'Register institution' }).click()

    await page.assertPath(route('home'))
    await page.assertVisible(page.getByRole('heading', { name: 'Aqua Swim Organisation' }))
    await page.assertVisible(page.getByRole('button', { name: 'Logout' }))
    await page.assertVisible('text=Aqua Swim Organisation is ready.')

    await db.assertHas('users', {
      email: 'jane@example.com',
      full_name: 'Jane Doe',
    })
    await db.assertHas('organisations', {
      name: 'Aqua Swim Organisation',
      slug: 'aqua-swim-organisation',
    })
    await db.assertHas('schools', {
      name: 'Aqua Swim Organisation',
      slug: 'aqua-swim-organisation',
      location: 'Accra',
    })

    const school = await School.findByOrFail('name', 'Aqua Swim Organisation')
    const membership = await Membership.query()
      .where('schoolId', school.id)
      .preload('roles')
      .firstOrFail()

    assert.isTrue(membership.roles.some((role) => role.name === RoleName.ADMINISTRATOR))
  })

  test('rejects a duplicate email and creates no school', async ({ visit, route, db }) => {
    await UserFactory.merge({ email: 'jane@example.com' }).create()

    const page = await visit(route('account_registrations.create'))

    await page.getByLabel('First name').fill('Jane')
    await page.getByLabel('Last name').fill('Doe')
    await page.getByLabel('Institutional email').fill('jane@example.com')
    await page.getByLabel('Institution name').fill('Aqua Swim Organisation')
    await page.getByLabel('Location').fill('Accra')
    await page.getByLabel('I agree to create this institution workspace for my swim school.').check()
    await page.getByRole('button', { name: 'Register institution' }).click()

    await page.assertPath(route('account_registrations.create'))
    await page.assertVisible('text=The email has already been taken')
    await db.assertCount('users', 1)
    await db.assertCount('schools', 0)
  })

  test('requires accepting the institution workspace statement', async ({ visit, route, db }) => {
    const page = await visit(route('account_registrations.create'))

    await page.getByLabel('First name').fill('Jane')
    await page.getByLabel('Last name').fill('Doe')
    await page.getByLabel('Institutional email').fill('jane@example.com')
    await page.getByLabel('Institution name').fill('Aqua Swim Organisation')
    await page.getByLabel('Location').fill('Accra')
    await page.getByRole('button', { name: 'Register institution' }).click()

    await page.assertPath(route('account_registrations.create'))
    await page.assertVisible('text=The terms field must be defined')
    await db.assertCount('users', 0)
    await db.assertCount('schools', 0)
  })
})
