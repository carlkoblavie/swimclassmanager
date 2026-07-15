import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'
import School from '#models/school'
import Membership from '#models/membership'

test.group('Schools store', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('founds a school, makes the founder its Administrator, and lands on the dashboard', async ({
    visit,
    route,
    browserContext,
    db,
    assert,
  }) => {
    const user = await UserFactory.apply('completed').create()
    await browserContext.loginAs(user)

    const page = await visit(route('schools.create'))
    await page.getByLabel('Organisation name').fill('Aqua Swim Organisation')
    await page.getByLabel('School name').fill('Aqua Swim School')
    await page.getByLabel('Location').fill('Accra')
    await page.getByRole('button', { name: 'Create school' }).click()

    await page.assertPath(route('home'))
    await page.assertVisible(page.getByRole('heading', { name: 'Aqua Swim School' }))
    await page.assertVisible('text=Accra')

    const school = await School.findByOrFail('name', 'Aqua Swim School')
    await db.assertHas('schools', { id: school.id, location: 'Accra', created_by_user_id: user.id })
    await db.assertHas('users', { id: user.id, active_school_id: school.id })

    const membership = await Membership.query()
      .where('school_id', school.id)
      .where('user_id', user.id)
      .firstOrFail()
    await membership.load('roles')
    assert.isTrue(membership.roles.some((role) => role.name === RoleName.ADMINISTRATOR))
  })

  test('rejects a submission missing a required field and creates no school ({field})')
    .with([
      {
        field: 'school name',
        fillName: false,
        fillLocation: true,
        error: 'The schoolName field must be defined',
      },
      {
        field: 'location',
        fillName: true,
        fillLocation: false,
        error: 'The location field must be defined',
      },
    ])
    .run(async ({ visit, route, browserContext, db }, row) => {
      const user = await UserFactory.apply('completed').create()
      await browserContext.loginAs(user)

      const page = await visit(route('schools.create'))
      await page.getByLabel('Organisation name').fill('Aqua Swim Organisation')
      if (row.fillName) {
        await page.getByLabel('School name').fill('Aqua Swim School')
      }
      if (row.fillLocation) {
        await page.getByLabel('Location').fill('Accra')
      }
      await page.getByRole('button', { name: 'Create school' }).click()

      await page.assertPath(route('schools.create'))
      await page.assertVisible(`text=${row.error}`)
      await db.assertCount('schools', 0)
    })

  test('rejects a duplicate name and location for the founder and creates no school', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const existing = await SchoolFactory.merge({
      createdByUserId: user.id,
      name: 'Aqua Swim School',
      location: 'Accra',
    }).create()
    await joinSchool(user, existing, RoleName.ADMINISTRATOR)
    await browserContext.loginAs(user)

    const page = await visit(route('schools.create'))
    await page.getByLabel('School name').fill('aqua swim school')
    await page.getByLabel('Location').fill('ACCRA')
    await page.getByRole('button', { name: 'Create school' }).click()

    await page.assertPath(route('schools.create'))
    await page.assertVisible('text=You already have a school with this name and location.')
    await db.assertCount('schools', 1)
  })

  test('allows the same name at a different location', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const existing = await SchoolFactory.merge({
      createdByUserId: user.id,
      name: 'Aqua Swim School',
      location: 'Accra',
    }).create()
    await joinSchool(user, existing, RoleName.ADMINISTRATOR)
    await browserContext.loginAs(user)

    const page = await visit(route('schools.create'))
    await page.getByLabel('School name').fill('Aqua Swim School')
    await page.getByLabel('Location').fill('Kumasi')
    await page.getByRole('button', { name: 'Create school' }).click()

    await page.assertPath(route('home'))
    await db.assertCount('schools', 2)
    await db.assertHas('schools', {
      name: 'Aqua Swim School',
      location: 'Kumasi',
      created_by_user_id: user.id,
    })
    await page.assertVisible('text=Kumasi')
  })

  test('creating a second school switches the active school to the newer one', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const first = await SchoolFactory.merge({
      createdByUserId: user.id,
      name: 'Aqua Swim School',
      location: 'Accra',
    }).create()
    await joinSchool(user, first, RoleName.ADMINISTRATOR)
    await browserContext.loginAs(user)

    const page = await visit(route('schools.create'))
    await page.getByLabel('School name').fill('Tornado School')
    await page.getByLabel('Location').fill('Kumasi')
    await page.getByRole('button', { name: 'Create school' }).click()

    await page.assertPath(route('home'))
    await page.assertVisible(page.getByRole('heading', { name: 'Tornado School' }))

    const second = await School.findByOrFail('name', 'Tornado School')
    await db.assertHas('users', { id: user.id, active_school_id: second.id })
  })
})
