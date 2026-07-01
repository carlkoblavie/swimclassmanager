import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'

test.group('Accounts update', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('completing the profile with name and phone lands on the dashboard ({country})')
    .with([{ country: 'Ghana' }, { country: undefined }])
    .run(async ({ visit, route, browserContext, db }, row) => {
      const user = await UserFactory.create()
      await browserContext.loginAs(user)

      const page = await visit(route('accounts.edit'))
      await page.getByLabel('Full name').fill('John Doe')
      await page.getByLabel('Phone').fill('5551234')
      if (row.country) {
        await page.getByLabel('Country').fill(row.country)
      }
      await page.getByRole('button', { name: 'Complete profile' }).click()

      await page.assertPath(route('home'))
      await page.assertVisible('text=It works')

      const expected: Record<string, unknown> = {
        id: user.id,
        full_name: 'John Doe',
        phone: '5551234',
      }
      if (row.country) {
        expected.country = row.country
      }
      await db.assertHas('users', expected)
    })

  test('rejects an incomplete profile ({fill})')
    .with([
      {
        fill: 'phone-only',
        error: 'The fullName field must be defined',
        typedField: 'phone',
        typedValue: '5551234',
      },
      {
        fill: 'name-only',
        error: 'The phone field must be defined',
        typedField: 'full_name',
        typedValue: 'John Doe',
      },
    ])
    .run(async ({ visit, route, browserContext, db }, row) => {
      const user = await UserFactory.create()
      await browserContext.loginAs(user)

      const page = await visit(route('accounts.edit'))
      if (row.fill === 'phone-only') {
        await page.getByLabel('Phone').fill('5551234')
      } else {
        await page.getByLabel('Full name').fill('John Doe')
      }
      await page.getByRole('button', { name: 'Complete profile' }).click()

      await page.assertPath(route('accounts.edit'))
      await page.assertVisible(`text=${row.error}`)
      await db.assertMissing('users', { id: user.id, [row.typedField]: row.typedValue })
    })
})
