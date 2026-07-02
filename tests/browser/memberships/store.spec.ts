import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { ClubFactory } from '#database/factories/club_factory'
import { InvitationFactory } from '#database/factories/invitation_factory'
import { seedRoles, joinClub } from '#tests/helpers'
import { RoleName } from '#values/role'
import Role from '#models/role'
import User from '#models/user'
import Membership from '#models/membership'

test.group('Memberships store', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('a valid token for a new email creates the account, joins with the role, and lands on complete-profile', async ({
    visit,
    route,
    db,
    assert,
  }) => {
    const founder = await UserFactory.create()
    const club = await ClubFactory.merge({ createdByUserId: founder.id }).create()
    const teacher = await Role.findByOrFail('name', RoleName.TEACHER)
    const invitation = await InvitationFactory.merge({
      clubId: club.id,
      roleId: teacher.id,
      email: 'invitee@example.com',
    }).create()

    const page = await visit(route('memberships.store', { token: invitation.token }))

    await page.assertPath(route('accounts.edit'))
    await db.assertHas('users', { email: 'invitee@example.com' })
    await page.assertExists(page.getByRole('button', { name: 'Logout' }))

    const user = await User.findByOrFail('email', 'invitee@example.com')
    await db.assertHas('users', { id: user.id, active_club_id: club.id })
    const membership = await Membership.query()
      .where('club_id', club.id)
      .where('user_id', user.id)
      .firstOrFail()
    await membership.load('roles')
    assert.isTrue(membership.roles.some((role) => role.name === RoleName.TEACHER))
  })

  test('a valid token for an existing completed user signs in, joins, and lands on the club dashboard', async ({
    visit,
    route,
    db,
  }) => {
    const founder = await UserFactory.create()
    const club = await ClubFactory.merge({
      createdByUserId: founder.id,
      name: 'Aqua Swim Club',
      location: 'Accra',
    }).create()
    const invitee = await UserFactory.apply('completed').create()
    const teacher = await Role.findByOrFail('name', RoleName.TEACHER)
    const invitation = await InvitationFactory.merge({
      clubId: club.id,
      roleId: teacher.id,
      email: invitee.email,
    }).create()

    const page = await visit(route('memberships.store', { token: invitation.token }))

    await page.assertPath(route('home'))
    await page.assertVisible('text=Aqua Swim Club')
    await page.assertExists(page.getByRole('button', { name: 'Logout' }))
    await db.assertHas('memberships', { club_id: club.id, user_id: invitee.id })
    await db.assertHas('users', { id: invitee.id, active_club_id: club.id })
  })

  test('an expired invitation link shows the expired message and does not join', async ({
    visit,
    route,
    db,
  }) => {
    const founder = await UserFactory.create()
    const club = await ClubFactory.merge({ createdByUserId: founder.id }).create()
    const teacher = await Role.findByOrFail('name', RoleName.TEACHER)
    const invitation = await InvitationFactory.apply('expired')
      .merge({ clubId: club.id, roleId: teacher.id, email: 'ghost@example.com' })
      .create()

    const page = await visit(route('memberships.store', { token: invitation.token }))

    await page.assertPath(route('sign_in_links.create'))
    await page.assertVisible(
      'text=This invitation has expired. Ask the person who invited you for a new one.'
    )
    await db.assertMissing('users', { email: 'ghost@example.com' })
    await db.assertCount('memberships', 0)
    await page.assertNotExists(page.getByRole('button', { name: 'Logout' }))
  })

  test('an already-accepted token re-opened signs in and creates no duplicate membership', async ({
    visit,
    route,
    db,
  }) => {
    const invitee = await UserFactory.apply('completed').create()
    const founder = await UserFactory.create()
    const club = await ClubFactory.merge({ createdByUserId: founder.id }).create()
    const teacher = await Role.findByOrFail('name', RoleName.TEACHER)
    await joinClub(invitee, club, RoleName.TEACHER)
    const invitation = await InvitationFactory.apply('accepted')
      .merge({ clubId: club.id, roleId: teacher.id, email: invitee.email })
      .create()

    const page = await visit(route('memberships.store', { token: invitation.token }))

    await page.assertPath(route('home'))
    await db.assertCount('memberships', 1)
    await page.assertExists(page.getByRole('button', { name: 'Logout' }))
  })

  test('a superseded (old) token after a re-send no longer accepts', async ({
    visit,
    route,
    db,
  }) => {
    const founder = await UserFactory.create()
    const club = await ClubFactory.merge({ createdByUserId: founder.id }).create()
    const teacher = await Role.findByOrFail('name', RoleName.TEACHER)
    const invitation = await InvitationFactory.merge({
      clubId: club.id,
      roleId: teacher.id,
      email: 'invitee@example.com',
    }).create()
    const oldToken = invitation.token
    invitation.token = `rotated-${oldToken}`
    await invitation.save()

    const page = await visit(route('memberships.store', { token: oldToken }))

    await page.assertPath(route('sign_in_links.create'))
    await page.assertVisible(
      'text=This invitation has expired. Ask the person who invited you for a new one.'
    )
    await db.assertMissing('users', { email: 'invitee@example.com' })
    await db.assertCount('memberships', 0)
  })
})
