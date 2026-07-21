import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { InvitationFactory } from '#database/factories/invitation_factory'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'
import Role from '#models/role'
import InvitationMail from '#mails/invitation'

test.group('Invitations store', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test(
    'an inviter sends an invitation, queuing the email and creating a pending invitation ({inviterRole})'
  )
    .with([{ inviterRole: RoleName.ADMINISTRATOR }, { inviterRole: RoleName.HEAD_COACH }])
    .run(async ({ visit, route, browserContext, db }, row) => {
      const inviter = await UserFactory.apply('completed').create()
      const school = await SchoolFactory.merge({ createdByUserId: inviter.id }).create()
      await joinSchool(inviter, school, row.inviterRole)
      await browserContext.loginAs(inviter)
      using fake = mail.fake()

      const page = await visit(route('invitations.create'))
      await page.getByLabel('First name').fill('Invited')
      await page.getByLabel('Last name').fill('Member')
      await page.getByLabel('Phone number').fill('0555000222')
      await page.getByLabel('Email').fill('invitee@example.com')
      await page.getByLabel('Role').selectOption('Teacher')
      await page.getByRole('button', { name: 'Send invitation' }).click()

      await page.assertPath(route('home'))
      await page.assertVisible('text=Invitation sent')
      fake.mails.assertQueued(InvitationMail, (m) => m.message.hasTo('invitee@example.com'))
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
    using fake = mail.fake()

    const page = await visit(route('invitations.create'))

    await page.assertNotExists(page.getByRole('button', { name: 'Send invitation' }))
    fake.mails.assertNoneQueued()
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
    using fake = mail.fake()

    const page = await visit(route('invitations.create'))
    await page.getByLabel('First name').fill('Invited')
    await page.getByLabel('Last name').fill('Member')
    await page.getByLabel('Phone number').fill('0555000222')
    await page.getByLabel('Email').fill('not-an-email')
    await page.getByLabel('Role').selectOption('Teacher')
    await page.getByRole('button', { name: 'Send invitation' }).click()

    await page.assertPath(route('invitations.create'))
    await page.assertVisible('text=The email field must be a valid email address')
    fake.mails.assertNoneQueued()
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
    using fake = mail.fake()

    const page = await visit(route('invitations.create'))
    await page.getByLabel('First name').fill('Invited')
    await page.getByLabel('Last name').fill('Member')
    await page.getByLabel('Phone number').fill('0555000222')
    await page.getByLabel('Email').fill('member@example.com')
    await page.getByLabel('Role').selectOption('Teacher')
    await page.getByRole('button', { name: 'Send invitation' }).click()

    await page.assertPath(route('invitations.create'))
    await page.assertVisible('text=This person is already a member.')
    fake.mails.assertNoneQueued()
    await db.assertCount('invitations', 0)
  })

  test('re-inviting a pending email refreshes the single invitation and queues mail', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const inviter = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: inviter.id }).create()
    await joinSchool(inviter, school, RoleName.ADMINISTRATOR)
    const teacher = await Role.findByOrFail('name', RoleName.TEACHER)
    const parent = await Role.findByOrFail('name', RoleName.PARENT)
    await InvitationFactory.merge({
      schoolId: school.id,
      roleId: teacher.id,
      email: 'invitee@example.com',
    }).create()
    await browserContext.loginAs(inviter)
    using fake = mail.fake()

    const page = await visit(route('invitations.create'))
    await page.getByLabel('First name').fill('Invited')
    await page.getByLabel('Last name').fill('Member')
    await page.getByLabel('Phone number').fill('0555000222')
    await page.getByLabel('Email').fill('invitee@example.com')
    await page.getByLabel('Role').selectOption('Parent')
    await page.getByRole('button', { name: 'Send invitation' }).click()

    await page.assertPath(route('home'))
    fake.mails.assertQueued(InvitationMail, (m) => m.message.hasTo('invitee@example.com'))
    await db.assertCount('invitations', 1)
    await db.assertHas('invitations', {
      school_id: school.id,
      email: 'invitee@example.com',
      role_id: parent.id,
    })
  })
})
