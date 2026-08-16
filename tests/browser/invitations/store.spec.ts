import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { InvitationFactory } from '#database/factories/invitation_factory'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'
import Role from '#models/role'

test.group('Invitations store', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('an inviter creates an invitation and gets a shareable link ({inviterRole})')
    .with([{ inviterRole: RoleName.ADMINISTRATOR }, { inviterRole: RoleName.HEAD_COACH }])
    .run(async ({ visit, route, browserContext, db }, row) => {
      const inviter = await UserFactory.apply('completed').create()
      const school = await SchoolFactory.merge({ createdByUserId: inviter.id }).create()
      await joinSchool(inviter, school, row.inviterRole)
      await browserContext.loginAs(inviter)

      const page = await visit(route('invitations.create'))
      await page.getByLabel('First name').fill('Invited')
      await page.getByLabel('Last name').fill('Member')
      await page.getByLabel('Phone number').fill('0555000222')
      await page.getByLabel('Email').fill('invitee@example.com')
      await page.getByLabel('Role').selectOption('Teacher')
      await page.getByRole('button', { name: 'Send invitation' }).click()

      await page.assertPath(route('invitations.create'))
      await page.assertVisible('text=Invitation created')
      await page.assertVisible('text=Share this link with Invited Member instead.')
      await page.assertExists(page.getByRole('link', { name: /invitations\// }))
      await page.assertExists(page.getByRole('button', { name: 'Copy link' }))
      await db.assertHas('invitations', {
        school_id: school.id,
        email: 'invitee@example.com',
        invitee_first_name: 'Invited',
        invitee_last_name: 'Member',
        invitee_phone: '0555000222',
        accepted_at: null,
      })
    })

  test('a member without invite permission cannot reach the invite form', async ({
    visit,
    route,
    browserContext,
  }) => {
    const member = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: member.id }).create()
    await joinSchool(member, school, RoleName.PARENT)
    await browserContext.loginAs(member)

    const page = await visit(route('invitations.create'))

    await page.assertNotExists(page.getByRole('button', { name: 'Send invitation' }))
  })

  test('rejects an invalid email and queues no mail', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const inviter = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: inviter.id }).create()
    await joinSchool(inviter, school, RoleName.ADMINISTRATOR)
    await browserContext.loginAs(inviter)

    const page = await visit(route('invitations.create'))
    await page.getByLabel('First name').fill('Invited')
    await page.getByLabel('Last name').fill('Member')
    await page.getByLabel('Phone number').fill('0555000222')
    await page.getByLabel('Email').fill('not-an-email')
    await page.getByLabel('Role').selectOption('Teacher')
    await page.getByRole('button', { name: 'Send invitation' }).click()

    await page.assertPath(route('invitations.create'))
    await page.assertVisible('text=The email field must be a valid email address')
    await db.assertCount('invitations', 0)
  })

  test('rejects inviting an existing member and queues no mail', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const inviter = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: inviter.id }).create()
    await joinSchool(inviter, school, RoleName.ADMINISTRATOR)
    const member = await UserFactory.merge({ email: 'member@example.com' }).create()
    await joinSchool(member, school, RoleName.PARENT)
    await browserContext.loginAs(inviter)

    const page = await visit(route('invitations.create'))
    await page.getByLabel('First name').fill('Invited')
    await page.getByLabel('Last name').fill('Member')
    await page.getByLabel('Phone number').fill('0555000222')
    await page.getByLabel('Email').fill('member@example.com')
    await page.getByLabel('Role').selectOption('Teacher')
    await page.getByRole('button', { name: 'Send invitation' }).click()

    await page.assertPath(route('invitations.create'))
    await page.assertVisible('text=This person is already a member.')
    await db.assertCount('invitations', 0)
  })

  test('rejects an email already used by another account', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const inviter = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: inviter.id }).create()
    await joinSchool(inviter, school, RoleName.ADMINISTRATOR)
    const existingUser = await UserFactory.merge({ email: 'existing@example.com' }).create()
    const otherSchool = await SchoolFactory.merge({
      organisationId: school.organisationId,
    }).create()
    await joinSchool(existingUser, otherSchool, RoleName.TEACHER)
    await browserContext.loginAs(inviter)

    const page = await visit(route('invitations.create'))
    await page.getByLabel('First name').fill('Invited')
    await page.getByLabel('Last name').fill('Member')
    await page.getByLabel('Phone number').fill('0555000222')
    await page.getByLabel('Email').fill('existing@example.com')
    await page.getByLabel('Role').selectOption('Teacher')
    await page.getByRole('button', { name: 'Send invitation' }).click()

    await page.assertVisible('text=This email is already in use.')
    await db.assertCount('invitations', 0)
  })

  test('rejects a phone number already used by another account', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const inviter = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: inviter.id }).create()
    await joinSchool(inviter, school, RoleName.ADMINISTRATOR)
    const existingUser = await UserFactory.merge({ phone: '0555000222' }).create()
    const otherSchool = await SchoolFactory.merge({
      organisationId: school.organisationId,
    }).create()
    await joinSchool(existingUser, otherSchool, RoleName.TEACHER)
    await browserContext.loginAs(inviter)

    const page = await visit(route('invitations.create'))
    await page.getByLabel('First name').fill('Invited')
    await page.getByLabel('Last name').fill('Member')
    await page.getByLabel('Phone number').fill('0555000222')
    await page.getByLabel('Email').fill('invitee@example.com')
    await page.getByLabel('Role').selectOption('Teacher')
    await page.getByRole('button', { name: 'Send invitation' }).click()

    await page.assertVisible('text=This phone number is already in use.')
    await db.assertCount('invitations', 0)
  })

  test('re-inviting a pending email refreshes the single invitation', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const inviter = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: inviter.id }).create()
    await joinSchool(inviter, school, RoleName.ADMINISTRATOR)
    const teacher = await Role.findByOrFail('name', RoleName.TEACHER)
    const deckSupervisor = await Role.findByOrFail('name', RoleName.DECK_SUPERVISOR)
    await InvitationFactory.merge({
      schoolId: school.id,
      roleId: teacher.id,
      email: 'invitee@example.com',
    }).create()
    await browserContext.loginAs(inviter)

    const page = await visit(route('invitations.create'))
    await page.getByLabel('First name').fill('Invited')
    await page.getByLabel('Last name').fill('Member')
    await page.getByLabel('Phone number').fill('0555000222')
    await page.getByLabel('Email').fill('invitee@example.com')
    await page.getByLabel('Role').selectOption(RoleName.DECK_SUPERVISOR)
    await page.getByRole('button', { name: 'Send invitation' }).click()

    await page.assertPath(route('invitations.create'))
    await page.assertVisible('text=Invitation created')
    await db.assertCount('invitations', 1)
    await db.assertHas('invitations', {
      school_id: school.id,
      email: 'invitee@example.com',
      role_id: deckSupervisor.id,
    })
  })

  test('does not allow a Parent invitation', async ({ visit, route, browserContext, db }) => {
    const inviter = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: inviter.id }).create()
    await joinSchool(inviter, school, RoleName.ADMINISTRATOR)
    await browserContext.loginAs(inviter)

    const page = await visit(route('invitations.create'))

    await page.assertExists(page.getByRole('option', { name: RoleName.PARENT, disabled: true }))
    await db.assertCount('invitations', 0)
  })
})
