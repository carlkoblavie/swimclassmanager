import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'

test.group('Home completion gate', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('an authenticated user without a completed profile is redirected to complete-profile', async ({
    visit,
    route,
    browserContext,
  }) => {
    const user = await UserFactory.create()
    await browserContext.loginAs(user)

    const page = await visit(route('home'))

    await page.assertPath(route('accounts.edit'))
  })

  test('a profile-complete user with an active school sees the dashboard', async ({
    visit,
    route,
    browserContext,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({
      createdByUserId: user.id,
      name: 'Aqua Swim School',
      location: 'Accra',
    }).create()
    user.activeSchoolId = school.id
    await user.save()
    await browserContext.loginAs(user)

    const page = await visit(route('home'))

    await page.assertPath(route('home'))
    await page.assertVisible(page.getByRole('heading', { name: 'Aqua Swim School' }))
  })

  test('a profile-complete user with no active school is redirected to create a school', async ({
    visit,
    route,
    browserContext,
  }) => {
    const user = await UserFactory.apply('completed').create()
    await browserContext.loginAs(user)

    const page = await visit(route('home'))

    await page.assertPath(route('schools.create'))
  })
})
