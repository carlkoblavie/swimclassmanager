import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { SwimmingClassFactory } from '#database/factories/swimming_class_factory'
import InvitationMail from '#mails/invitation'
import { seedRoles, joinSchool, seedCurriculum } from '#tests/helpers'
import { RoleName } from '#values/role'

test.group('Swimming classes update', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('a manager updates the schedule, details, and location', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.ADMINISTRATOR)
    const { level, stage } = await seedCurriculum()
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      levelId: level.id,
      levelStageId: stage.id,
      name: 'Monday Splash',
      code: 'AQT-4820',
      weekday: 1,
    }).create()
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.edit', { id: swimmingClass.id }))
    await page.getByLabel('Class name').fill('Wednesday Waves')
    await page.getByLabel('Day').selectOption('3')
    await page.getByLabel('Start time').fill('18:30')
    await page.getByLabel('Duration (mins)').fill('60')
    await page.getByLabel('Location').fill('Lane 4')
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.assertPath(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.assertVisible('text=Class updated.')
    await db.assertHas('swimming_classes', {
      id: swimmingClass.id,
      name: 'Wednesday Waves',
      weekday: 3,
      start_time: '18:30',
      duration_minutes: 60,
      location: 'Lane 4',
    })
  })

  test('a manager assigns an existing instructor', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.ADMINISTRATOR)
    const teacher = await UserFactory.apply('completed').create()
    // The factory's completed state overrides merged names; set it directly.
    teacher.fullName = 'Coach Sarah'
    await teacher.save()
    const teacherMembership = await joinSchool(teacher, school, RoleName.TEACHER)
    // joinSchool switches the active user; restore the manager's session focus.
    await browserContext.loginAs(user)
    const { level, stage } = await seedCurriculum()
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      levelId: level.id,
      levelStageId: stage.id,
    }).create()

    const page = await visit(route('swimming_classes.edit', { id: swimmingClass.id }))
    await page.getByLabel('Instructor').selectOption('existing')
    await page.getByLabel('Existing instructor').selectOption(String(teacherMembership.id))
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.assertPath(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.assertVisible('text=Coach Sarah')
    await db.assertHas('swimming_classes', {
      id: swimmingClass.id,
      instructor_membership_id: teacherMembership.id,
    })
  })

  test('a manager invites a pending Teacher from the edit form', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.ADMINISTRATOR)
    const { level, stage } = await seedCurriculum()
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      levelId: level.id,
      levelStageId: stage.id,
    }).create()
    await browserContext.loginAs(user)
    using fake = mail.fake()

    const page = await visit(route('swimming_classes.edit', { id: swimmingClass.id }))
    await page.getByLabel('Instructor').selectOption('invite')
    await page.getByLabel('Teacher name').fill('Pending Coach')
    await page.getByLabel('Teacher phone').fill('0555000111')
    await page.getByLabel('Teacher email').fill('pending@example.com')
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.assertPath(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.assertVisible('text=Class updated. Teacher invited.')
    await page.assertVisible(page.getByText('Pending', { exact: true }))
    await db.assertHas('invitations', {
      school_id: school.id,
      email: 'pending@example.com',
      invitee_name: 'Pending Coach',
    })
    fake.mails.assertQueued(InvitationMail, ({ message }) =>
      message.hasTo('pending@example.com')
    )
  })
})
