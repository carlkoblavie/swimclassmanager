import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import MagicLinkMail from '#mails/magic_link'
import { UserFactory } from '#database/factories/user_factory'

test.group('SignInLinks store', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('sends a sign-in link and shows the neutral message for "{email}"')
    .with([
      { email: 'new@example.com', existing: false },
      { email: 'existing@example.com', existing: true },
    ])
    .run(async ({ visit, route }, row) => {
      using fake = mail.fake()

      if (row.existing) {
        await UserFactory.merge({ email: row.email }).create()
      }

      const page = await visit(route('sign_in_links.create'))
      await page.getByLabel('Email').fill(row.email)
      await page.getByRole('button', { name: 'Send sign-in link' }).click()

      fake.mails.assertQueued(MagicLinkMail, (m) => m.message.hasTo(row.email))
      await page.assertVisible('text=Check your email for a sign-in link.')
      await page.assertPath(route('sign_in_links.create'))
    })

  test('rejects a malformed email and sends no mail', async ({ visit, route }) => {
    using fake = mail.fake()

    const page = await visit(route('sign_in_links.create'))
    await page.getByLabel('Email').fill('foo@bar')
    await page.getByRole('button', { name: 'Send sign-in link' }).click()

    await page.assertPath(route('sign_in_links.create'))
    await page.assertVisible('text=The email field must be a valid email address')
    fake.mails.assertNoneQueued()
  })
})
