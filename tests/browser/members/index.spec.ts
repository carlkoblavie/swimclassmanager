import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { InvitationFactory } from '#database/factories/invitation_factory'
import { joinSchool, seedRoles } from '#tests/helpers'
import { RoleName } from '#values/role'
import Role from '#models/role'

test.group('Members index', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('shows active members and pending invitations for the active school', async ({
    visit,
    route,
    browserContext,
  }) => {
    const owner = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({
      createdByUserId: owner.id,
      name: 'Swim With Carl',
    }).create()
    await joinSchool(owner, school, RoleName.ADMINISTRATOR)

    const teacher = await UserFactory.merge({
      fullName: 'Amina Osei',
      email: 'amina@example.com',
      phone: '0555000111',
    }).create()
    await joinSchool(teacher, school, RoleName.TEACHER)

    const teacherRole = await Role.findByOrFail('name', RoleName.TEACHER)
    await InvitationFactory.merge({
      schoolId: school.id,
      roleId: teacherRole.id,
      email: 'pending@example.com',
      inviteeFirstName: 'Pending',
      inviteeLastName: 'Instructor',
    }).create()

    await browserContext.loginAs(owner)
    const page = await visit(route('members.index'))

    await page.assertPath(route('members.index'))
    await page.assertVisible(page.getByRole('heading', { name: 'Members' }))
    await page.assertVisible('text=Swim With Carl · Team')
    await page.assertVisible('text=Amina Osei')
    await page.assertVisible('text=Active (2)')
    await page.assertVisible('text=Invited (1)')
    await page.assertVisible('text=Disabled (0)')

    await page.getByRole('tab', { name: 'Invited (1)' }).click()
    await page.assertVisible('text=Pending Instructor')
  })
})
