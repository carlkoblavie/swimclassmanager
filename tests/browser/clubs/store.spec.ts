import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { ClubFactory } from '#database/factories/club_factory'
import { seedRoles } from '#tests/helpers'
import { RoleName } from '#values/role'
import Club from '#models/club'
import Membership from '#models/membership'

test.group('Clubs store', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('founds a club, makes the founder its Administrator, and lands on the dashboard', async ({
    visit,
    route,
    browserContext,
    db,
    assert,
  }) => {
    const user = await UserFactory.apply('completed').create()
    await browserContext.loginAs(user)

    const page = await visit(route('clubs.create'))
    await page.getByLabel('Name').fill('Aqua Swim Club')
    await page.getByLabel('Location').fill('Accra')
    await page.getByRole('button', { name: 'Create club' }).click()

    await page.assertPath(route('home'))
    await page.assertVisible(page.getByRole('heading', { name: 'Aqua Swim Club' }))
    await page.assertVisible('text=Accra')

    const club = await Club.findByOrFail('name', 'Aqua Swim Club')
    await db.assertHas('clubs', { id: club.id, location: 'Accra', created_by_user_id: user.id })
    await db.assertHas('users', { id: user.id, active_club_id: club.id })

    const membership = await Membership.query()
      .where('club_id', club.id)
      .where('user_id', user.id)
      .firstOrFail()
    await membership.load('roles')
    assert.isTrue(membership.roles.some((role) => role.name === RoleName.ADMINISTRATOR))
  })

  test('rejects a submission missing a required field and creates no club ({field})')
    .with([
      {
        field: 'name',
        fillName: false,
        fillLocation: true,
        error: 'The name field must be defined',
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

      const page = await visit(route('clubs.create'))
      if (row.fillName) {
        await page.getByLabel('Name').fill('Aqua Swim Club')
      }
      if (row.fillLocation) {
        await page.getByLabel('Location').fill('Accra')
      }
      await page.getByRole('button', { name: 'Create club' }).click()

      await page.assertPath(route('clubs.create'))
      await page.assertVisible(`text=${row.error}`)
      await db.assertCount('clubs', 0)
    })

  test('rejects a duplicate name and location for the founder and creates no club', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const user = await UserFactory.apply('completed').create()
    await ClubFactory.merge({
      createdByUserId: user.id,
      name: 'Aqua Swim Club',
      location: 'Accra',
    }).create()
    await browserContext.loginAs(user)

    const page = await visit(route('clubs.create'))
    await page.getByLabel('Name').fill('aqua swim club')
    await page.getByLabel('Location').fill('ACCRA')
    await page.getByRole('button', { name: 'Create club' }).click()

    await page.assertPath(route('clubs.create'))
    await page.assertVisible('text=You already have a club with this name and location.')
    await db.assertCount('clubs', 1)
  })

  test('allows the same name at a different location', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const user = await UserFactory.apply('completed').create()
    await ClubFactory.merge({
      createdByUserId: user.id,
      name: 'Aqua Swim Club',
      location: 'Accra',
    }).create()
    await browserContext.loginAs(user)

    const page = await visit(route('clubs.create'))
    await page.getByLabel('Name').fill('Aqua Swim Club')
    await page.getByLabel('Location').fill('Kumasi')
    await page.getByRole('button', { name: 'Create club' }).click()

    await page.assertPath(route('home'))
    await db.assertCount('clubs', 2)
    await db.assertHas('clubs', {
      name: 'Aqua Swim Club',
      location: 'Kumasi',
      created_by_user_id: user.id,
    })
    await page.assertVisible('text=Kumasi')
  })

  test('creating a second club switches the active club to the newer one', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const first = await ClubFactory.merge({
      createdByUserId: user.id,
      name: 'Aqua Swim Club',
      location: 'Accra',
    }).create()
    user.activeClubId = first.id
    await user.save()
    await browserContext.loginAs(user)

    const page = await visit(route('clubs.create'))
    await page.getByLabel('Name').fill('Tornado Club')
    await page.getByLabel('Location').fill('Kumasi')
    await page.getByRole('button', { name: 'Create club' }).click()

    await page.assertPath(route('home'))
    await page.assertVisible(page.getByRole('heading', { name: 'Tornado Club' }))

    const second = await Club.findByOrFail('name', 'Tornado Club')
    await db.assertHas('users', { id: user.id, active_club_id: second.id })
  })
})
