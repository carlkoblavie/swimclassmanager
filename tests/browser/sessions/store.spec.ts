import { test, timeTravel } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'
import { UserFactory } from '#database/factories/user_factory'

test.group('Sessions store', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('a valid link for a new email creates the account, signs in, lands on complete-profile', async ({
    visit,
    route,
    db,
  }) => {
    const url = signedUrlFor('auth.verify', [], {
      expiresIn: '15 minutes',
      qs: { email: 'new@example.com' },
    })

    const page = await visit(url)

    await page.assertPath(route('accounts.edit'))
    await db.assertHas('users', { email: 'new@example.com' })
    await page.assertExists(page.getByRole('button', { name: 'Logout' }))
  })

  test('an existing completed user with no club signs in and lands on create-a-club', async ({
    visit,
    route,
    db,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const url = signedUrlFor('auth.verify', [], {
      expiresIn: '15 minutes',
      qs: { email: user.email },
    })

    const page = await visit(url)

    await page.assertPath(route('clubs.create'))
    await db.assertCount('users', 1)
    await page.assertExists(page.getByRole('button', { name: 'Logout' }))
  })

  test('an expired link shows the request-a-new-link message and does not sign in', async ({
    visit,
    route,
    db,
  }) => {
    const url = signedUrlFor('auth.verify', [], {
      expiresIn: '15 minutes',
      qs: { email: 'ghost@example.com' },
    })
    timeTravel('16 minutes')

    const page = await visit(url)

    await page.assertPath(route('sign_in_links.create'))
    await page.assertVisible('text=This sign-in link has expired. Request a new one.')
    await db.assertMissing('users', { email: 'ghost@example.com' })
    await page.assertNotExists(page.getByRole('button', { name: 'Logout' }))
  })
})
