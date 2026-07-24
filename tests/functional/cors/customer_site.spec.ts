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

  test('allows local static previews to read only the public catalog', async ({
    client,
    assert,
  }) => {
    const fileResponse = await client
      .get('/api/register/swim-africa-ghana/swim-africa-ghana/plans')
      .header('Origin', 'null')
    const localhostResponse = await client
      .get('/api/register/swim-africa-ghana/swim-africa-ghana/plans')
      .header('Origin', 'http://localhost:8787')
    const appPageResponse = await client.get('/dashboard').header('Origin', 'http://localhost:8787')

    assert.equal(fileResponse.header('access-control-allow-origin'), 'null')
    assert.equal(localhostResponse.header('access-control-allow-origin'), 'http://localhost:8787')
    assert.isUndefined(appPageResponse.header('access-control-allow-origin'))
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
