import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { LevelFactory } from '#database/factories/level_factory'
import { SkillFactory } from '#database/factories/skill_factory'
import { InvitationFactory } from '#database/factories/invitation_factory'
import { SwimmingClassFactory } from '#database/factories/swimming_class_factory'
import { SwimmingClassSessionFactory } from '#database/factories/swimming_class_session_factory'
import { ClassStageFactory } from '#database/factories/class_stage_factory'
import { ClassStageSkillFactory } from '#database/factories/class_stage_skill_factory'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'

const MANAGER_ROLES = [RoleName.ADMINISTRATOR, RoleName.HEAD_COACH]
const NON_MANAGER_ROLES = [
  RoleName.TEACHER,
  RoleName.DECK_SUPERVISOR,
  RoleName.PARENT,
  RoleName.STUDENT,
]

test.group('Swimming classes show', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('members can view a class detail with its progression and schedule', async ({
    visit,
    route,
    browserContext,
  }) => {
    await seedRoles()
    const member = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: member.id }).create()
    await joinSchool(member, school, RoleName.PARENT)

    const instructor = await UserFactory.apply('completed').create()
    instructor.fullName = 'Coach Ada'
    await instructor.save()
    const instructorMembership = await joinSchool(instructor, school, RoleName.TEACHER)

    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      levelId: level.id,
      instructorMembershipId: instructorMembership.id,
      code: 'DETAIL-101',
      name: 'Saturday Beginners',
      location: 'Main Pool',
      capacity: 8,
      startDate: DateTime.fromISO('2026-08-01'),
      endDate: DateTime.fromISO('2026-08-29'),
      startTime: '09:00',
      endTime: '10:00',
    }).create()
    const streamline = await SkillFactory.merge({
      schoolId: school.id,
      name: 'Streamline',
    }).create()
    const kick = await SkillFactory.merge({
      schoolId: school.id,
      name: 'Kick independently',
    }).create()
    const warmUp = await ClassStageFactory.merge({
      swimmingClassId: swimmingClass.id,
      name: 'Warm up',
      position: 1,
    }).create()
    const skills = await ClassStageFactory.merge({
      swimmingClassId: swimmingClass.id,
      name: 'Core skills',
      position: 2,
    }).create()
    await ClassStageSkillFactory.merge({ classStageId: warmUp.id, skillId: streamline.id }).create()
    await ClassStageSkillFactory.merge({ classStageId: skills.id, skillId: kick.id }).create()
    await SwimmingClassSessionFactory.merge({
      swimmingClassId: swimmingClass.id,
      startsAt: DateTime.fromISO('2026-08-01T09:00:00'),
      endsAt: DateTime.fromISO('2026-08-01T10:00:00'),
    }).create()
    await SwimmingClassSessionFactory.merge({
      swimmingClassId: swimmingClass.id,
      startsAt: DateTime.fromISO('2026-08-08T09:00:00'),
      endsAt: DateTime.fromISO('2026-08-08T10:00:00'),
    }).create()
    await browserContext.loginAs(member)

    const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))

    await page.assertPath(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.assertVisible('text=Saturday Beginners')
    await page.assertVisible('text=DETAIL-101')
    await page.assertVisible('text=Learn to Swim — Beginners')
    await page.assertVisible('text=Coach Ada')
    await page.assertVisible('text=Location: Main Pool')
    await page.assertVisible('text=Capacity: 8 learners')
    await page.assertVisible('text=1. Warm up')
    await page.assertVisible('text=Streamline')
    await page.assertVisible('text=2. Core skills')
    await page.assertVisible('text=Kick independently')
    await page.assertVisible('text=01 Aug 2026, 09:00 – 01 Aug 2026, 10:00')
    await page.assertVisible('text=08 Aug 2026, 09:00 – 08 Aug 2026, 10:00')
  })

  test('class managers see edit and cancel controls on class detail')
    .with(MANAGER_ROLES)
    .run(async ({ visit, route, browserContext }, roleName) => {
      await seedRoles()
      const manager = await UserFactory.apply('completed').create()
      const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
      await joinSchool(manager, school, roleName)
      const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
      const level = await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()
      const swimmingClass = await SwimmingClassFactory.merge({
        schoolId: school.id,
        levelId: level.id,
        code: 'MANAGE-101',
        name: 'Managed Class',
      }).create()
      await SwimmingClassSessionFactory.merge({
        swimmingClassId: swimmingClass.id,
        startsAt: DateTime.fromISO('2026-08-01T09:00:00'),
        endsAt: DateTime.fromISO('2026-08-01T10:00:00'),
      }).create()
      await browserContext.loginAs(manager)

      const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))

      await page.assertPath(route('swimming_classes.show', { id: swimmingClass.id }))
      await page.assertVisible(page.getByRole('link', { name: 'Edit class' }))
      await page.assertVisible(page.getByRole('button', { name: 'Cancel class' }))
      await page.assertVisible(page.getByRole('button', { name: 'Cancel session' }))
    })

  test('non-managers do not see edit or cancel controls on class detail')
    .with(NON_MANAGER_ROLES)
    .run(async ({ visit, route, browserContext }, roleName) => {
      await seedRoles()
      const member = await UserFactory.apply('completed').create()
      const school = await SchoolFactory.merge({ createdByUserId: member.id }).create()
      await joinSchool(member, school, roleName)
      const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
      const level = await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()
      const swimmingClass = await SwimmingClassFactory.merge({
        schoolId: school.id,
        levelId: level.id,
        code: 'VIEW-101',
        name: 'View Only Class',
      }).create()
      await SwimmingClassSessionFactory.merge({
        swimmingClassId: swimmingClass.id,
        startsAt: DateTime.fromISO('2026-08-01T09:00:00'),
        endsAt: DateTime.fromISO('2026-08-01T10:00:00'),
      }).create()
      await browserContext.loginAs(member)

      const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))

      await page.assertPath(route('swimming_classes.show', { id: swimmingClass.id }))
      await page.assertVisible('text=VIEW-101')
      await page.assertNotExists(page.getByRole('link', { name: 'Edit class' }))
      await page.assertNotExists(page.getByRole('button', { name: 'Cancel class' }))
      await page.assertNotExists(page.getByRole('button', { name: 'Cancel session' }))
    })

  test('cancelled classes and sessions remain visible on class detail', async ({
    visit,
    route,
    browserContext,
  }) => {
    await seedRoles()
    const member = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: member.id }).create()
    await joinSchool(member, school, RoleName.PARENT)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()
    const swimmingClass = await SwimmingClassFactory.apply('cancelled')
      .merge({
        schoolId: school.id,
        levelId: level.id,
        code: 'CNX-101',
        name: 'Sunday Beginners',
      })
      .create()
    await SwimmingClassSessionFactory.apply('cancelled')
      .merge({
        swimmingClassId: swimmingClass.id,
        startsAt: DateTime.fromISO('2026-08-01T09:00:00'),
        endsAt: DateTime.fromISO('2026-08-01T10:00:00'),
      })
      .create()
    await browserContext.loginAs(member)

    const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))

    await page.assertPath(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.assertVisible('text=CNX-101')
    await page.assertVisible('text=Sunday Beginners')
    await page.assertVisible('text=01 Aug 2026, 09:00 – 01 Aug 2026, 10:00')
    await page.assertVisible(page.getByText('Cancelled', { exact: true }).first())
    await page.assertVisible(page.getByText('Cancelled', { exact: true }).nth(1))
  })

  test('pending instructors are shown as pending on class detail', async ({
    visit,
    route,
    browserContext,
  }) => {
    await seedRoles()
    const member = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: member.id }).create()
    await joinSchool(member, school, RoleName.PARENT)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()
    const invitation = await InvitationFactory.merge({
      schoolId: school.id,
      email: 'pending.teacher@example.com',
      inviteeName: 'Pending Coach',
      inviteePhone: '0400 000 000',
    }).create()
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      levelId: level.id,
      pendingInstructorInvitationId: invitation.id,
      instructorMembershipId: null,
      code: 'PENDING-101',
      name: 'Pending Instructor Class',
    }).create()
    await browserContext.loginAs(member)

    const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))

    await page.assertPath(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.assertVisible('text=PENDING-101')
    await page.assertVisible('text=Pending Coach')
    await page.assertVisible(page.getByText('Pending', { exact: true }))
  })

  test("members cannot view another school's class detail", async ({
    visit,
    route,
    browserContext,
  }) => {
    await seedRoles()
    const member = await UserFactory.apply('completed').create()
    const schoolA = await SchoolFactory.merge({ createdByUserId: member.id }).create()
    const schoolB = await SchoolFactory.create()
    await joinSchool(member, schoolA, RoleName.PARENT)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()
    const otherClass = await SwimmingClassFactory.merge({
      schoolId: schoolB.id,
      levelId: level.id,
      code: 'OTHER-DETAIL',
      name: 'Other School Class',
    }).create()
    await browserContext.loginAs(member)

    const page = await visit(route('swimming_classes.show', { id: otherClass.id }))

    await page.assertNotExists('text=OTHER-DETAIL')
    await page.assertNotExists('text=Other School Class')
    await page.assertNotExists('text=Class details')
  })
})
