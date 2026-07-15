import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { LevelFactory } from '#database/factories/level_factory'
import { SkillFactory } from '#database/factories/skill_factory'
import { SwimmingClassFactory } from '#database/factories/swimming_class_factory'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'
import InvitationMail from '#mails/invitation'
import Role from '#models/role'
import SwimmingClass from '#models/swimming_class'
import SwimmingClassSession from '#models/swimming_class_session'
import SwimmingClassWeekday from '#models/swimming_class_weekday'

test.group('Swimming classes store', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('managers create a class with a manual code and existing instructor', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)

    const instructor = await UserFactory.apply('completed').create()
    instructor.fullName = 'Coach Ada'
    await instructor.save()
    const instructorMembership = await joinSchool(instructor, school, RoleName.TEACHER)

    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({
      programId: program.id,
      name: 'Beginners',
      capacity: 8,
    }).create()
    const skill = await SkillFactory.merge({ schoolId: school.id, name: 'Streamline' }).create()
    await browserContext.loginAs(manager)

    const page = await visit(route('swimming_classes.create'))
    await page.getByLabel('Class code').fill(' swim-101 ')
    await page.getByLabel('Class name').fill('Saturday Beginners')
    await page.getByLabel('Program level').selectOption(String(level.id))
    await page.getByLabel('Start date').fill('2026-08-01')
    await page.getByLabel('End date').fill('2026-08-01')
    await page.getByLabel('Saturday').check()
    await page.getByLabel('Start time').fill('09:00')
    await page.getByLabel('End time').fill('10:00')
    await page.getByLabel('Capacity').fill('8')
    await page.getByLabel('Location').fill('Main Pool')
    await page.getByLabel('Existing instructor').selectOption(String(instructorMembership.id))

    await page.getByRole('button', { name: 'Add stage' }).click()
    await page.getByLabel('Stage name').fill('Water confidence')
    await page.getByLabel('Streamline (School skill)').check()
    await page.getByRole('button', { name: 'Save stage' }).click()
    await page.getByRole('button', { name: 'Create class' }).click()

    await page.assertVisible('text=Class created.')
    await page.assertVisible('text=SWIM-101')
    await page.assertVisible('text=Coach Ada')
    await db.assertHas('swimming_classes', {
      school_id: school.id,
      level_id: level.id,
      code: 'SWIM-101',
      name: 'Saturday Beginners',
      instructor_membership_id: instructorMembership.id,
    })
    await db.assertHas('class_stage_skills', { skill_id: skill.id })
  })

  test('blank class codes are generated per school', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)

    const instructor = await UserFactory.apply('completed').create()
    instructor.fullName = 'Coach Ada'
    await instructor.save()
    const instructorMembership = await joinSchool(instructor, school, RoleName.TEACHER)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({
      programId: program.id,
      name: 'Beginners',
      capacity: 8,
    }).create()
    await SkillFactory.merge({ schoolId: school.id, name: 'Streamline' }).create()
    await browserContext.loginAs(manager)

    const page = await visit(route('swimming_classes.create'))
    await page.getByLabel('Class name').fill('Generated Code Class')
    await page.getByLabel('Program level').selectOption(String(level.id))
    await page.getByLabel('Start date').fill('2026-08-01')
    await page.getByLabel('End date').fill('2026-08-01')
    await page.getByLabel('Saturday').check()
    await page.getByLabel('Start time').fill('09:00')
    await page.getByLabel('End time').fill('10:00')
    await page.getByLabel('Capacity').fill('8')
    await page.getByLabel('Location').fill('Main Pool')
    await page.getByLabel('Existing instructor').selectOption(String(instructorMembership.id))
    await page.getByRole('button', { name: 'Add stage' }).click()
    await page.getByLabel('Stage name').fill('Water confidence')
    await page.getByLabel('Streamline (School skill)').check()
    await page.getByRole('button', { name: 'Save stage' }).click()
    await page.getByRole('button', { name: 'Create class' }).click()

    const created = await SwimmingClass.query().where('schoolId', school.id).firstOrFail()
    assert.isTrue(created.code.length > 0)
    await page.assertVisible(`text=${created.code}`)
  })

  test('class creation generates scheduled sessions', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)

    const instructor = await UserFactory.apply('completed').create()
    instructor.fullName = 'Coach Ada'
    await instructor.save()
    const instructorMembership = await joinSchool(instructor, school, RoleName.TEACHER)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({
      programId: program.id,
      name: 'Beginners',
      capacity: 8,
    }).create()
    await SkillFactory.merge({ schoolId: school.id, name: 'Streamline' }).create()
    await browserContext.loginAs(manager)

    const page = await visit(route('swimming_classes.create'))
    await page.getByLabel('Class name').fill('Monday Beginners')
    await page.getByLabel('Program level').selectOption(String(level.id))
    await page.getByLabel('Start date').fill('2026-08-03')
    await page.getByLabel('End date').fill('2026-08-10')
    await page.getByLabel('Monday').check()
    await page.getByLabel('Start time').fill('09:00')
    await page.getByLabel('End time').fill('10:00')
    await page.getByLabel('Capacity').fill('8')
    await page.getByLabel('Location').fill('Main Pool')
    await page.getByLabel('Existing instructor').selectOption(String(instructorMembership.id))
    await page.getByRole('button', { name: 'Add stage' }).click()
    await page.getByLabel('Stage name').fill('Water confidence')
    await page.getByLabel('Streamline (School skill)').check()
    await page.getByRole('button', { name: 'Save stage' }).click()
    await page.getByRole('button', { name: 'Create class' }).click()

    await page.assertVisible('text=03 Aug 2026, 09:00 – 03 Aug 2026, 10:00')
    await page.assertVisible('text=10 Aug 2026, 09:00 – 10 Aug 2026, 10:00')
    const created = await SwimmingClass.query().where('schoolId', school.id).firstOrFail()
    const sessions = await SwimmingClassSession.query().where('swimmingClassId', created.id)
    const weekdays = await SwimmingClassWeekday.query().where('swimmingClassId', created.id)
    assert.lengthOf(sessions, 2)
    assert.deepEqual(sessions.map((session) => session.startsAt.toISO()).sort(), [
      '2026-08-03T09:00:00.000+00:00',
      '2026-08-10T09:00:00.000+00:00',
    ])
    assert.deepEqual(
      weekdays.map((weekday) => weekday.weekday),
      [1]
    )
  })

  test('class creation stores ordered stages and skills', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)

    const instructor = await UserFactory.apply('completed').create()
    instructor.fullName = 'Coach Ada'
    await instructor.save()
    const instructorMembership = await joinSchool(instructor, school, RoleName.TEACHER)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({
      programId: program.id,
      name: 'Beginners',
      capacity: 8,
    }).create()
    const existingSkill = await SkillFactory.merge({
      schoolId: school.id,
      name: 'Streamline',
    }).create()
    await browserContext.loginAs(manager)

    const page = await visit(route('swimming_classes.create'))
    await page.getByLabel('Class name').fill('Progression Class')
    await page.getByLabel('Program level').selectOption(String(level.id))
    await page.getByLabel('Start date').fill('2026-08-01')
    await page.getByLabel('End date').fill('2026-08-01')
    await page.getByLabel('Saturday').check()
    await page.getByLabel('Start time').fill('09:00')
    await page.getByLabel('End time').fill('10:00')
    await page.getByLabel('Capacity').fill('8')
    await page.getByLabel('Location').fill('Main Pool')
    await page.getByLabel('Existing instructor').selectOption(String(instructorMembership.id))

    await page.getByRole('button', { name: 'Add stage' }).click()
    await page.getByLabel('Stage name').fill('Water confidence')
    await page.getByLabel('Streamline (School skill)').check()
    await page.getByRole('button', { name: 'Save stage' }).click()

    await page.getByRole('button', { name: 'Add stage' }).click()
    await page.getByLabel('Stage name').fill('Independent kicking')
    await page.getByRole('button', { name: 'Add skill' }).click()
    await page.getByLabel('Skill name').fill('Kick independently')
    await page.getByLabel('Skill description').fill('Learner kicks without support.')
    await page.getByRole('button', { name: 'Save stage' }).click()

    await page.getByRole('button', { name: 'Create class' }).click()

    await page.assertVisible('text=1. Water confidence')
    await page.assertVisible('text=Streamline')
    await page.assertVisible('text=2. Independent kicking')
    await page.assertVisible('text=Kick independently')
    await db.assertHas('class_stages', { name: 'Water confidence', position: 1 })
    await db.assertHas('class_stages', { name: 'Independent kicking', position: 2 })
    await db.assertHas('class_stage_skills', { skill_id: existingSkill.id })
    await db.assertHas('skills', {
      school_id: school.id,
      name: 'Kick independently',
      description: 'Learner kicks without support.',
    })
  })

  test('managers invite a pending Teacher while creating a class', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({
      programId: program.id,
      name: 'Beginners',
      capacity: 8,
    }).create()
    await SkillFactory.merge({ schoolId: school.id, name: 'Streamline' }).create()
    await browserContext.loginAs(manager)
    using fake = mail.fake()

    const page = await visit(route('swimming_classes.create'))
    await page.getByLabel('Class name').fill('Pending Teacher Class')
    await page.getByLabel('Program level').selectOption(String(level.id))
    await page.getByLabel('Start date').fill('2026-08-01')
    await page.getByLabel('End date').fill('2026-08-01')
    await page.getByLabel('Saturday').check()
    await page.getByLabel('Start time').fill('09:00')
    await page.getByLabel('End time').fill('10:00')
    await page.getByLabel('Capacity').fill('8')
    await page.getByLabel('Location').fill('Main Pool')
    await page.getByLabel('Instructor', { exact: true }).selectOption('invite')
    await page.getByLabel('Teacher name').fill('Pending Coach')
    await page.getByLabel('Teacher phone').fill('0400 000 000')
    await page.getByLabel('Teacher email').fill('pending.coach@example.com')
    await page.getByRole('button', { name: 'Add stage' }).click()
    await page.getByLabel('Stage name').fill('Water confidence')
    await page.getByLabel('Streamline (School skill)').check()
    await page.getByRole('button', { name: 'Save stage' }).click()
    await page.getByRole('button', { name: 'Create class' }).click()

    await page.assertVisible('text=Class created.')
    await page.assertVisible('text=Teacher invited.')
    await page.assertVisible('text=Pending Coach')
    await page.assertVisible(page.getByText('Pending', { exact: true }))
    const teacherRole = await Role.findByOrFail('name', RoleName.TEACHER)
    await db.assertHas('invitations', {
      school_id: school.id,
      role_id: teacherRole.id,
      email: 'pending.coach@example.com',
      invitee_name: 'Pending Coach',
      invitee_phone: '0400 000 000',
      accepted_at: null,
    })
    await db.assertHas('swimming_classes', {
      school_id: school.id,
      name: 'Pending Teacher Class',
      instructor_membership_id: null,
    })
    const created = await SwimmingClass.query().where('schoolId', school.id).firstOrFail()
    fake.mails.assertQueued(InvitationMail, (message) =>
      message.message.hasTo('pending.coach@example.com')
    )
    await db.assertHas('swimming_classes', {
      id: created.id,
      pending_instructor_invitation_id: created.pendingInstructorInvitationId,
    })
  })

  test('duplicate class codes are rejected', async ({ visit, route, browserContext, assert }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    const instructor = await UserFactory.apply('completed').create()
    instructor.fullName = 'Coach Ada'
    await instructor.save()
    const instructorMembership = await joinSchool(instructor, school, RoleName.TEACHER)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({
      programId: program.id,
      name: 'Beginners',
      capacity: 8,
    }).create()
    await SwimmingClassFactory.merge({
      schoolId: school.id,
      levelId: level.id,
      code: 'DUP-101',
      name: 'Existing Class',
    }).create()
    await SkillFactory.merge({ schoolId: school.id, name: 'Streamline' }).create()
    await browserContext.loginAs(manager)

    const page = await visit(route('swimming_classes.create'))
    await page.getByLabel('Class code').fill(' dup-101 ')
    await page.getByLabel('Class name').fill('Duplicate Class')
    await page.getByLabel('Program level').selectOption(String(level.id))
    await page.getByLabel('Start date').fill('2026-08-01')
    await page.getByLabel('End date').fill('2026-08-01')
    await page.getByLabel('Saturday').check()
    await page.getByLabel('Start time').fill('09:00')
    await page.getByLabel('End time').fill('10:00')
    await page.getByLabel('Capacity').fill('8')
    await page.getByLabel('Location').fill('Main Pool')
    await page.getByLabel('Existing instructor').selectOption(String(instructorMembership.id))
    await page.getByRole('button', { name: 'Add stage' }).click()
    await page.getByLabel('Stage name').fill('Water confidence')
    await page.getByLabel('Streamline (School skill)').check()
    await page.getByRole('button', { name: 'Save stage' }).click()
    await page.getByRole('button', { name: 'Create class' }).click()

    await page.assertPath(route('swimming_classes.create'))
    await page.assertVisible('text=A class with this code already exists.')
    const classCount = await SwimmingClass.query().where('schoolId', school.id)
    assert.lengthOf(classCount, 1)
  })

  test('capacity above the level capacity is rejected', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    const instructor = await UserFactory.apply('completed').create()
    instructor.fullName = 'Coach Ada'
    await instructor.save()
    const instructorMembership = await joinSchool(instructor, school, RoleName.TEACHER)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({
      programId: program.id,
      name: 'Beginners',
      capacity: 8,
    }).create()
    await SkillFactory.merge({ schoolId: school.id, name: 'Streamline' }).create()
    await browserContext.loginAs(manager)

    const page = await visit(route('swimming_classes.create'))
    await page.getByLabel('Class name').fill('Oversized Class')
    await page.getByLabel('Program level').selectOption(String(level.id))
    await page.getByLabel('Start date').fill('2026-08-01')
    await page.getByLabel('End date').fill('2026-08-01')
    await page.getByLabel('Saturday').check()
    await page.getByLabel('Start time').fill('09:00')
    await page.getByLabel('End time').fill('10:00')
    await page.getByLabel('Capacity').fill('9')
    await page.getByLabel('Location').fill('Main Pool')
    await page.getByLabel('Existing instructor').selectOption(String(instructorMembership.id))
    await page.getByRole('button', { name: 'Add stage' }).click()
    await page.getByLabel('Stage name').fill('Water confidence')
    await page.getByLabel('Streamline (School skill)').check()
    await page.getByRole('button', { name: 'Save stage' }).click()
    await page.getByRole('button', { name: 'Create class' }).click()

    await page.assertPath(route('swimming_classes.create'))
    await page.assertVisible('text=Class capacity cannot exceed the level capacity.')
    const classes = await SwimmingClass.query().where('schoolId', school.id)
    assert.lengthOf(classes, 0)
  })

  test('schedules that produce no sessions are rejected', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    const instructor = await UserFactory.apply('completed').create()
    instructor.fullName = 'Coach Ada'
    await instructor.save()
    const instructorMembership = await joinSchool(instructor, school, RoleName.TEACHER)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({
      programId: program.id,
      name: 'Beginners',
      capacity: 8,
    }).create()
    await SkillFactory.merge({ schoolId: school.id, name: 'Streamline' }).create()
    await browserContext.loginAs(manager)

    const page = await visit(route('swimming_classes.create'))
    await page.getByLabel('Class name').fill('No Session Class')
    await page.getByLabel('Program level').selectOption(String(level.id))
    await page.getByLabel('Start date').fill('2026-08-01')
    await page.getByLabel('End date').fill('2026-08-01')
    await page.getByLabel('Monday').check()
    await page.getByLabel('Start time').fill('09:00')
    await page.getByLabel('End time').fill('10:00')
    await page.getByLabel('Capacity').fill('8')
    await page.getByLabel('Location').fill('Main Pool')
    await page.getByLabel('Existing instructor').selectOption(String(instructorMembership.id))
    await page.getByRole('button', { name: 'Add stage' }).click()
    await page.getByLabel('Stage name').fill('Water confidence')
    await page.getByLabel('Streamline (School skill)').check()
    await page.getByRole('button', { name: 'Save stage' }).click()
    await page.getByRole('button', { name: 'Create class' }).click()

    await page.assertPath(route('swimming_classes.create'))
    await page.assertVisible('text=The schedule does not generate any sessions.')
    const classes = await SwimmingClass.query().where('schoolId', school.id)
    const sessions = await SwimmingClassSession.query()
    assert.lengthOf(classes, 0)
    assert.lengthOf(sessions, 0)
  })

  test('failed pending-Teacher class creation queues no mail', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({
      programId: program.id,
      name: 'Beginners',
      capacity: 8,
    }).create()
    await SkillFactory.merge({ schoolId: school.id, name: 'Streamline' }).create()
    await browserContext.loginAs(manager)
    using fake = mail.fake()

    const page = await visit(route('swimming_classes.create'))
    await page.getByLabel('Class name').fill('Failed Pending Class')
    await page.getByLabel('Program level').selectOption(String(level.id))
    await page.getByLabel('Start date').fill('2026-08-01')
    await page.getByLabel('End date').fill('2026-08-01')
    await page.getByLabel('Saturday').check()
    await page.getByLabel('Start time').fill('09:00')
    await page.getByLabel('End time').fill('10:00')
    await page.getByLabel('Capacity').fill('9')
    await page.getByLabel('Location').fill('Main Pool')
    await page.getByLabel('Instructor', { exact: true }).selectOption('invite')
    await page.getByLabel('Teacher name').fill('Pending Coach')
    await page.getByLabel('Teacher phone').fill('0400 000 000')
    await page.getByLabel('Teacher email').fill('pending.coach@example.com')
    await page.getByRole('button', { name: 'Add stage' }).click()
    await page.getByLabel('Stage name').fill('Water confidence')
    await page.getByLabel('Streamline (School skill)').check()
    await page.getByRole('button', { name: 'Save stage' }).click()
    await page.getByRole('button', { name: 'Create class' }).click()

    await page.assertPath(route('swimming_classes.create'))
    await page.assertVisible('text=Class capacity cannot exceed the level capacity.')
    await db.assertCount('swimming_classes', 0)
    await db.assertCount('invitations', 0)
    fake.mails.assertNoneQueued()
  })
})
