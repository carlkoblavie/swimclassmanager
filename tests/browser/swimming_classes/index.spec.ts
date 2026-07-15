import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { LevelFactory } from '#database/factories/level_factory'
import { SwimmingClassFactory } from '#database/factories/swimming_class_factory'
import { SwimmingClassSessionFactory } from '#database/factories/swimming_class_session_factory'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'

const MANAGER_ROLES = [RoleName.ADMINISTRATOR, RoleName.HEAD_COACH]
const NON_MANAGER_ROLES = [
  RoleName.TEACHER,
  RoleName.DECK_SUPERVISOR,
  RoleName.PARENT,
  RoleName.STUDENT,
]

test.group('Swimming classes index', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('unauthenticated visitors cannot open the classes index', async ({ visit, route }) => {
    const page = await visit(route('swimming_classes.index'))

    await page.assertPath(route('sign_in_links.create'))
    await page.assertNotExists('text=No classes yet.')
  })

  test('incomplete-profile users cannot open the classes index', async ({
    visit,
    route,
    browserContext,
  }) => {
    const user = await UserFactory.create()
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.index'))

    await page.assertPath(route('accounts.edit'))
    await page.assertNotExists('text=No classes yet.')
  })

  test('users without an active school cannot open the classes index', async ({
    visit,
    route,
    browserContext,
  }) => {
    const user = await UserFactory.apply('completed').create()
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.index'))

    await page.assertPath(route('schools.create'))
    await page.assertNotExists('text=No classes yet.')
  })

  test('every school role can view the classes index')
    .with([
      RoleName.ADMINISTRATOR,
      RoleName.HEAD_COACH,
      RoleName.TEACHER,
      RoleName.DECK_SUPERVISOR,
      RoleName.PARENT,
      RoleName.STUDENT,
    ])
    .run(async ({ visit, route, browserContext }, roleName) => {
      await seedRoles()
      const user = await UserFactory.apply('completed').create()
      const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
      await joinSchool(user, school, roleName)
      await browserContext.loginAs(user)

      const page = await visit(route('swimming_classes.index'))

      await page.assertPath(route('swimming_classes.index'))
      await page.assertVisible('text=No classes yet.')
    })

  test('members see the empty classes state', async ({ visit, route, browserContext }) => {
    await seedRoles()
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.PARENT)
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.index'))

    await page.assertPath(route('swimming_classes.index'))
    await page.assertVisible('text=No classes yet.')
  })

  test('members see only classes from their active school', async ({
    visit,
    route,
    browserContext,
  }) => {
    await seedRoles()
    const member = await UserFactory.apply('completed').create()
    const schoolA = await SchoolFactory.merge({ createdByUserId: member.id }).create()
    const schoolB = await SchoolFactory.create()
    await joinSchool(member, schoolA, RoleName.PARENT)

    const instructor = await UserFactory.apply('completed').create()
    instructor.fullName = 'Coach Ada'
    await instructor.save()
    const instructorMembership = await joinSchool(instructor, schoolA, RoleName.TEACHER)

    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()
    const visibleClass = await SwimmingClassFactory.merge({
      schoolId: schoolA.id,
      levelId: level.id,
      instructorMembershipId: instructorMembership.id,
      code: 'AQUA-101',
      name: 'Saturday Beginners',
      location: 'Main Pool',
      capacity: 8,
    }).create()
    await SwimmingClassSessionFactory.merge({
      swimmingClassId: visibleClass.id,
      startsAt: DateTime.fromISO('2026-08-01T09:00:00'),
      endsAt: DateTime.fromISO('2026-08-01T10:00:00'),
    }).create()
    await SwimmingClassFactory.merge({
      schoolId: schoolB.id,
      levelId: level.id,
      code: 'OTHER-201',
      name: 'Hidden School Class',
    }).create()
    await browserContext.loginAs(member)

    const page = await visit(route('swimming_classes.index'))

    await page.assertPath(route('swimming_classes.index'))
    await page.assertVisible('text=AQUA-101')
    await page.assertVisible('text=Saturday Beginners')
    await page.assertVisible('text=Learn to Swim — Beginners')
    await page.assertVisible('text=Coach Ada')
    await page.assertVisible('text=Main Pool')
    await page.assertVisible('text=Capacity: 8 learners')
    await page.assertVisible('text=Next session: 01 Aug 2026, 09:00')
    await page.assertNotExists('text=OTHER-201')
    await page.assertNotExists('text=Hidden School Class')
  })

  test('class managers see the create-class entry point on the index')
    .with(MANAGER_ROLES)
    .run(async ({ visit, route, browserContext }, roleName) => {
      await seedRoles()
      const user = await UserFactory.apply('completed').create()
      const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
      await joinSchool(user, school, roleName)
      await browserContext.loginAs(user)

      const page = await visit(route('swimming_classes.index'))

      await page.assertPath(route('swimming_classes.index'))
      await page.assertVisible(page.getByRole('link', { name: 'Create class' }).first())
    })

  test('non-managers do not see the create-class entry point on the index')
    .with(NON_MANAGER_ROLES)
    .run(async ({ visit, route, browserContext }, roleName) => {
      await seedRoles()
      const user = await UserFactory.apply('completed').create()
      const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
      await joinSchool(user, school, roleName)
      await browserContext.loginAs(user)

      const page = await visit(route('swimming_classes.index'))

      await page.assertPath(route('swimming_classes.index'))
      await page.assertVisible('text=No classes yet.')
      await page.assertNotExists(page.getByRole('link', { name: 'Create class' }))
    })

  test('cancelled classes remain listed as cancelled', async ({ visit, route, browserContext }) => {
    await seedRoles()
    const member = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: member.id }).create()
    await joinSchool(member, school, RoleName.PARENT)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()
    await SwimmingClassFactory.apply('cancelled')
      .merge({
        schoolId: school.id,
        levelId: level.id,
        code: 'CANCEL-101',
        name: 'Sunday Beginners',
      })
      .create()
    await browserContext.loginAs(member)

    const page = await visit(route('swimming_classes.index'))

    await page.assertPath(route('swimming_classes.index'))
    await page.assertVisible('text=CANCEL-101')
    await page.assertVisible('text=Sunday Beginners')
    await page.assertVisible('text=Cancelled')
  })
})
