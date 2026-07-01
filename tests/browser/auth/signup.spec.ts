import { test } from '@japa/runner'

test.group('Signup retirement', () => {
  test('the old signup route no longer exists', async ({ visit }) => {
    const page = await visit('/signup')

    // No signup form is served, and the route itself is gone (404 — dev env
    // renders the framework error page; production renders errors/not_found).
    await page.assertNotExists(page.getByRole('button', { name: 'Sign up' }))
    await page.assertVisible(page.getByText('Cannot GET:/signup', { exact: true }).first())
  })
})
