import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { ClubFactory } from '#database/factories/club_factory'

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

  test('a profile-complete user with an active club sees the dashboard', async ({
    visit,
    route,
    browserContext,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const club = await ClubFactory.merge({
      createdByUserId: user.id,
      name: 'Aqua Swim Club',
      location: 'Accra',
    }).create()
    user.activeClubId = club.id
    await user.save()
    await browserContext.loginAs(user)

    const page = await visit(route('home'))

    await page.assertPath(route('home'))
    await page.assertVisible(page.getByRole('heading', { name: 'Aqua Swim Club' }))
  })

  test('a profile-complete user with no active club is redirected to create a club', async ({
    visit,
    route,
    browserContext,
  }) => {
    const user = await UserFactory.apply('completed').create()
    await browserContext.loginAs(user)

    const page = await visit(route('home'))

    await page.assertPath(route('clubs.create'))
  })
})
