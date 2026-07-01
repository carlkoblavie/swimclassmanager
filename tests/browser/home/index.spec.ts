import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'

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

  test('an authenticated user with a completed profile sees the dashboard', async ({
    visit,
    route,
    browserContext,
  }) => {
    const user = await UserFactory.apply('completed').create()
    await browserContext.loginAs(user)

    const page = await visit(route('home'))

    await page.assertPath(route('home'))
    await page.assertVisible('text=It works')
  })
})
