import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { SwimmingClassFactory } from '#database/factories/swimming_class_factory'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'

const ALL_ROLES = [
  RoleName.ADMINISTRATOR,
  RoleName.HEAD_COACH,
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

  test('every school role can view the classes index ({roleName})')
    .with(ALL_ROLES.map((roleName) => ({ roleName })))
    .run(async ({ visit, route, browserContext }, { roleName }) => {
      await seedRoles()
      const user = await UserFactory.apply('completed').create()
      const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
      await joinSchool(user, school, roleName)
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
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.PARENT)
    await SwimmingClassFactory.merge({
      schoolId: school.id,
      name: 'Splash Hour',
      code: 'MON-1001',
      weekday: 1,
    }).create()
    await SwimmingClassFactory.merge({ name: 'Other School Class', code: 'OTH-9999' }).create()
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.index'))

    await page.assertVisible('text=Splash Hour')
    await page.assertVisible('text=MON-1001')
    await page.assertVisible('text=Monday · 9:00 AM')
    await page.assertNotExists('text=Other School Class')
  })

  test('cancelled classes remain listed as cancelled', async ({
    visit,
    route,
    browserContext,
  }) => {
    await seedRoles()
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.PARENT)
    await SwimmingClassFactory.apply('cancelled')
      .merge({ schoolId: school.id, name: 'Sunset Swimmers' })
      .create()
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.index'))

    await page.assertVisible('text=Sunset Swimmers')
    await page.assertVisible('text=Cancelled')
  })
})
