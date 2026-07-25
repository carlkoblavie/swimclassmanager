import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import hash from '@adonisjs/core/services/hash'
import Membership from '#models/membership'
import School from '#models/school'
import User from '#models/user'
import { UserFactory } from '#database/factories/user_factory'
import { RoleName } from '#values/role'
import { seedRoles } from '#tests/helpers'

test.group('Account registrations', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('creates a waitlist account and leaves the founder signed out', async ({
    visit,
    route,
    db,
    assert,
  }) => {
    const page = await visit(route('account_registrations.create'))

    await page.getByLabel('First name').fill('Jane')
    await page.getByLabel('Last name').fill('Doe')
    await page.getByLabel('Institutional email').fill('jane@example.com')
    await page.getByLabel('Phone number').fill('0240000998')
    await page.getByLabel('Institution name').fill('Aqua Swim Organisation')
    await page.getByLabel('Location').fill('Accra')
    await page.getByLabel('Notify me when we launch').check()
    await page.getByRole('button', { name: 'Join the waitlist' }).click()

    await page.assertPath(route('account_registrations.create'))
    await page.assertVisible(page.getByRole('heading', { name: 'Join our waitlist' }))
    await page.assertVisible('text=Aqua Swim Organisation has joined the waitlist.')

    await db.assertHas('users', {
      email: 'jane@example.com',
      full_name: 'Jane Doe',
      phone: '0240000998',
    })

    const founder = await User.findByOrFail('email', 'jane@example.com')
    assert.isTrue(await hash.verify(founder.password!, 'Welcome1234!!'))
    assert.isTrue(Boolean(founder.mustChangePassword))
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
    await page.getByLabel('Phone number').fill('0240000998')
    await page.getByLabel('Institution name').fill('Aqua Swim Organisation')
    await page.getByLabel('Location').fill('Accra')
    await page.getByLabel('Notify me when we launch').check()
    await page.getByRole('button', { name: 'Join the waitlist' }).click()

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
    await page.getByLabel('Phone number').fill('0240000998')
    await page.getByLabel('Institution name').fill('Aqua Swim Organisation')
    await page.getByLabel('Location').fill('Accra')
    await page.getByRole('button', { name: 'Join the waitlist' }).click()

    await page.assertPath(route('account_registrations.create'))
    await page.assertVisible('text=The terms field must be defined')
    await db.assertCount('users', 0)
    await db.assertCount('schools', 0)
  })
})
