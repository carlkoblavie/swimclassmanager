import { test } from '@japa/runner'

test.group('Customer site CORS', () => {
  test('allows the Swim Africa Ghana website to read public catalog responses', async ({
    client,
    assert,
  }) => {
    const response = await client
      .get('/api/register/swim-africa-ghana/swim-africa-ghana/plans')
      .header('Origin', 'https://swimafricaghana.com')

    assert.equal(response.header('access-control-allow-origin'), 'https://swimafricaghana.com')
    assert.equal(response.header('access-control-allow-credentials'), 'true')
  })

  test('allows the www Swim Africa Ghana website origin', async ({ client, assert }) => {
    const response = await client
      .get('/api/register/swim-africa-ghana/swim-africa-ghana/plans')
      .header('Origin', 'https://www.swimafricaghana.com')

    assert.equal(response.header('access-control-allow-origin'), 'https://www.swimafricaghana.com')
  })

  test('allows customer site preflight requests for the public API', async ({ client, assert }) => {
    const response = await client
      .options('/api/register/swim-africa-ghana/swim-africa-ghana/plans')
      .header('Origin', 'https://swimafricaghana.com')
      .header('Access-Control-Request-Method', 'GET')
      .header('Access-Control-Request-Headers', 'accept')

    response.assertStatus(204)
    assert.equal(response.header('access-control-allow-origin'), 'https://swimafricaghana.com')
    assert.equal(response.header('access-control-allow-methods'), 'GET,HEAD,POST,PUT,DELETE')
    assert.equal(response.header('access-control-allow-headers'), 'accept')
  })

  test('does not allow arbitrary websites to read public catalog responses', async ({
    client,
    assert,
  }) => {
    const response = await client
      .get('/api/register/swim-africa-ghana/swim-africa-ghana/plans')
      .header('Origin', 'https://example.com')

    assert.isUndefined(response.header('access-control-allow-origin'))
  })
})
