import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { SwimmingClassFactory } from '#database/factories/swimming_class_factory'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'

test.group('Swimming classes cancel', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('a manager cancels a class without deleting it', async ({
    visit,
    route,
    browserContext,
    db,
    assert,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.ADMINISTRATOR)
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      name: 'Monday Splash',
    }).create()
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.getByRole('button', { name: 'Cancel class' }).click()

    await page.assertVisible('text=Class cancelled.')
    await page.assertVisible('text=Monday Splash')
    await page.assertVisible(page.getByText('Cancelled', { exact: true }))

    await swimmingClass.refresh()
    assert.isNotNull(swimmingClass.cancelledAt)
    await db.assertHas('swimming_classes', { id: swimmingClass.id })
  })

  test('a manager cannot cancel another school class', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.ADMINISTRATOR)
    const other = await SwimmingClassFactory.merge({ name: 'Hidden Class' }).create()
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.show', { id: other.id }))
    await page.assertNotExists('text=Hidden Class')

    await other.refresh()
    assert.isNull(other.cancelledAt)
  })
})
