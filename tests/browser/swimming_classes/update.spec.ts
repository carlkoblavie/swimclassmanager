import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { SwimmingClassFactory } from '#database/factories/swimming_class_factory'
import InvitationMail from '#mails/invitation'
import { seedRoles, joinSchool, seedCurriculum } from '#tests/helpers'
import { ClassInstructorRole } from '#values/class_instructor_role'
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

  test('a manager assigns an existing lead instructor', async ({
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
    await page.getByRole('combobox', { name: 'Lead instructor' }).click()
    await page.getByRole('option', { name: /Coach Sarah/ }).click()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.assertPath(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.assertVisible('text=Coach Sarah')
    await db.assertHas('class_instructors', {
      swimming_class_id: swimmingClass.id,
      membership_id: teacherMembership.id,
      role: ClassInstructorRole.LEAD,
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
    await page.getByRole('button', { name: 'Invite a new teacher' }).click()
    await page.getByLabel('First name').fill('Pending')
    await page.getByLabel('Last name').fill('Coach')
    await page.getByLabel('Phone number').fill('0555000111')
    await page.getByLabel('Email', { exact: true }).fill('pending@example.com')
    await page.getByRole('combobox', { name: 'Certifications' }).fill('Lifeguard Level 1')
    await page.keyboard.press('Enter')
    await page.getByRole('combobox', { name: 'Certifications' }).fill('First Aid')
    await page.keyboard.press('Enter')
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.assertPath(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.assertVisible('text=Class updated. Teacher invited.')
    await page.assertVisible(page.getByText('Pending', { exact: true }))
    await db.assertHas('invitations', {
      school_id: school.id,
      email: 'pending@example.com',
      invitee_first_name: 'Pending',
      invitee_last_name: 'Coach',
      certifications: JSON.stringify(['Lifeguard Level 1', 'First Aid']),
    })
    await db.assertHas('class_instructors', {
      swimming_class_id: swimmingClass.id,
      role: ClassInstructorRole.SUPPORTING,
    })
    fake.mails.assertQueued(InvitationMail, ({ message }) => message.hasTo('pending@example.com'))
  })
})
