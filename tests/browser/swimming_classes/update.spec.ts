import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { LevelFactory } from '#database/factories/level_factory'
import { SkillFactory } from '#database/factories/skill_factory'
import { SwimmingClassFactory } from '#database/factories/swimming_class_factory'
import { SwimmingClassWeekdayFactory } from '#database/factories/swimming_class_weekday_factory'
import { SwimmingClassSessionFactory } from '#database/factories/swimming_class_session_factory'
import { ClassStageFactory } from '#database/factories/class_stage_factory'
import { ClassStageSkillFactory } from '#database/factories/class_stage_skill_factory'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'
import InvitationMail from '#mails/invitation'
import Role from '#models/role'
import SwimmingClass from '#models/swimming_class'
import SwimmingClassSession from '#models/swimming_class_session'
import ClassStage from '#models/class_stage'

test.group('Swimming classes update', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('managers update class details and progression', async ({
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
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      levelId: level.id,
      instructorMembershipId: instructorMembership.id,
      code: 'UP-101',
      name: 'Original Class',
      startDate: DateTime.fromISO('2026-08-01'),
      endDate: DateTime.fromISO('2026-08-01'),
      startTime: '09:00',
      endTime: '10:00',
      capacity: 8,
      location: 'Main Pool',
    }).create()
    await SwimmingClassWeekdayFactory.merge({
      swimmingClassId: swimmingClass.id,
      weekday: 6,
    }).create()
    await SwimmingClassSessionFactory.merge({
      swimmingClassId: swimmingClass.id,
      startsAt: DateTime.fromISO('2026-08-01T09:00:00'),
      endsAt: DateTime.fromISO('2026-08-01T10:00:00'),
    }).create()
    const oldSkill = await SkillFactory.merge({ schoolId: school.id, name: 'Old skill' }).create()
    const newSkill = await SkillFactory.merge({ schoolId: school.id, name: 'Back float' }).create()
    const oldStage = await ClassStageFactory.merge({
      swimmingClassId: swimmingClass.id,
      name: 'Old stage',
      position: 1,
    }).create()
    await ClassStageSkillFactory.merge({ classStageId: oldStage.id, skillId: oldSkill.id }).create()
    await browserContext.loginAs(manager)

    const page = await visit(route('swimming_classes.edit', { id: swimmingClass.id }))
    await page.getByLabel('Class code').fill('up-202')
    await page.getByLabel('Class name').fill('Updated Class')
    await page.getByLabel('Capacity').fill('7')
    await page.getByLabel('Location').fill('Training Pool')
    await page.getByRole('button', { name: 'Remove' }).click()
    await page.getByRole('button', { name: 'Add stage' }).click()
    await page.getByLabel('Stage name').fill('Updated stage')
    await page.getByLabel('Back float (School skill)').check()
    await page.getByRole('button', { name: 'Save stage' }).click()
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.assertPath(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.assertVisible('text=Class updated.')
    await page.assertVisible('text=UP-202')
    await page.assertVisible('text=Updated Class')
    await page.assertVisible('text=Location: Training Pool')
    await page.assertVisible('text=Capacity: 7 learners')
    await page.assertVisible('text=1. Updated stage')
    await page.assertVisible('text=Back float')
    await page.assertNotExists('text=Old stage')
    await db.assertHas('swimming_classes', {
      id: swimmingClass.id,
      code: 'UP-202',
      name: 'Updated Class',
      capacity: 7,
      location: 'Training Pool',
    })
    await db.assertHas('class_stage_skills', { skill_id: newSkill.id })
    await db.assertMissing('class_stage_skills', { skill_id: oldSkill.id })
    const stages = await ClassStage.query().where('swimmingClassId', swimmingClass.id)
    if (stages.length !== 1) {
      throw new Error(`Expected one replacement stage, found ${stages.length}`)
    }
  })

  test('schedule edits preserve past sessions and regenerate future sessions', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)

    const instructor = await UserFactory.apply('completed').create()
    const instructorMembership = await joinSchool(instructor, school, RoleName.TEACHER)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({
      programId: program.id,
      name: 'Beginners',
      capacity: 8,
    }).create()
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      levelId: level.id,
      instructorMembershipId: instructorMembership.id,
      code: 'SCHED-101',
      name: 'Schedule Class',
      startDate: DateTime.fromISO('2026-07-08'),
      endDate: DateTime.fromISO('2026-07-22'),
      startTime: '09:00',
      endTime: '10:00',
      capacity: 8,
      location: 'Main Pool',
    }).create()
    await SwimmingClassWeekdayFactory.merge({
      swimmingClassId: swimmingClass.id,
      weekday: 3,
    }).create()
    const pastSession = await SwimmingClassSessionFactory.merge({
      swimmingClassId: swimmingClass.id,
      startsAt: DateTime.fromISO('2026-07-08T09:00:00'),
      endsAt: DateTime.fromISO('2026-07-08T10:00:00'),
    }).create()
    const oldFutureSession = await SwimmingClassSessionFactory.merge({
      swimmingClassId: swimmingClass.id,
      startsAt: DateTime.fromISO('2026-07-22T09:00:00'),
      endsAt: DateTime.fromISO('2026-07-22T10:00:00'),
    }).create()
    const skill = await SkillFactory.merge({ schoolId: school.id, name: 'Streamline' }).create()
    const stage = await ClassStageFactory.merge({
      swimmingClassId: swimmingClass.id,
      name: 'Water confidence',
      position: 1,
    }).create()
    await ClassStageSkillFactory.merge({ classStageId: stage.id, skillId: skill.id }).create()
    await browserContext.loginAs(manager)

    const page = await visit(route('swimming_classes.edit', { id: swimmingClass.id }))
    await page.getByLabel('End date').fill('2026-07-30')
    await page.getByLabel('Wednesday').uncheck()
    await page.getByLabel('Thursday').check()
    await page.getByLabel('Start time').fill('11:00')
    await page.getByLabel('End time').fill('12:00')
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.assertPath(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.assertVisible('text=Class updated.')
    await page.assertVisible('text=08 Jul 2026, 09:00 – 08 Jul 2026, 10:00')
    await page.assertVisible('text=16 Jul 2026, 11:00 – 16 Jul 2026, 12:00')
    await page.assertVisible('text=23 Jul 2026, 11:00 – 23 Jul 2026, 12:00')
    await page.assertVisible('text=30 Jul 2026, 11:00 – 30 Jul 2026, 12:00')
    await page.assertNotExists('text=22 Jul 2026, 09:00 – 22 Jul 2026, 10:00')

    const reloadedPast = await SwimmingClassSession.findOrFail(pastSession.id)
    assert.equal(reloadedPast.startsAt.toISO(), pastSession.startsAt.toISO())
    const removedFuture = await SwimmingClassSession.find(oldFutureSession.id)
    assert.isNull(removedFuture)
    const sessions = await SwimmingClassSession.query().where('swimmingClassId', swimmingClass.id)
    assert.lengthOf(sessions, 4)
  })

  test('managers invite a pending Teacher while editing a class', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)

    const instructor = await UserFactory.apply('completed').create()
    const instructorMembership = await joinSchool(instructor, school, RoleName.TEACHER)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({
      programId: program.id,
      name: 'Beginners',
      capacity: 8,
    }).create()
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      levelId: level.id,
      instructorMembershipId: instructorMembership.id,
      code: 'INVITE-EDIT',
      name: 'Invite Edit Class',
      startDate: DateTime.fromISO('2026-08-01'),
      endDate: DateTime.fromISO('2026-08-01'),
      startTime: '09:00',
      endTime: '10:00',
      capacity: 8,
      location: 'Main Pool',
    }).create()
    await SwimmingClassWeekdayFactory.merge({
      swimmingClassId: swimmingClass.id,
      weekday: 6,
    }).create()
    await SwimmingClassSessionFactory.merge({
      swimmingClassId: swimmingClass.id,
      startsAt: DateTime.fromISO('2026-08-01T09:00:00'),
      endsAt: DateTime.fromISO('2026-08-01T10:00:00'),
    }).create()
    const skill = await SkillFactory.merge({ schoolId: school.id, name: 'Streamline' }).create()
    const stage = await ClassStageFactory.merge({
      swimmingClassId: swimmingClass.id,
      name: 'Water confidence',
      position: 1,
    }).create()
    await ClassStageSkillFactory.merge({ classStageId: stage.id, skillId: skill.id }).create()
    await browserContext.loginAs(manager)
    using fake = mail.fake()

    const page = await visit(route('swimming_classes.edit', { id: swimmingClass.id }))
    await page.getByLabel('Instructor', { exact: true }).selectOption('invite')
    await page.getByLabel('Teacher name').fill('Pending Coach')
    await page.getByLabel('Teacher phone').fill('0400 000 000')
    await page.getByLabel('Teacher email').fill('pending.coach@example.com')
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.assertPath(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.assertVisible('text=Class updated.')
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
      id: swimmingClass.id,
      instructor_membership_id: null,
    })
    const updated = await SwimmingClass.findOrFail(swimmingClass.id)
    await db.assertHas('swimming_classes', {
      id: swimmingClass.id,
      pending_instructor_invitation_id: updated.pendingInstructorInvitationId,
    })
    fake.mails.assertQueued(InvitationMail, (message) =>
      message.message.hasTo('pending.coach@example.com')
    )
  })
})
