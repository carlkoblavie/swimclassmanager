import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'
import { UserFactory } from '#database/factories/user_factory'
import { seedRoles } from '#tests/helpers'

const validPayload = {
  firstName: 'Jane',
  lastName: 'Doe',
  accountType: 'swim_school',
  organisationName: 'Aqua Swim Organisation',
  location: 'Accra',
  phone: '0240000998',
  email: 'jane@example.com',
  password: 'supersecret',
}

test.group('Account creation API', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('creates an account with an email/password credential and founds a school', async ({
    client,
    assert,
  }) => {
    const response = await client.post('/api/accounts').accept('json').json(validPayload)

    response.assertStatus(201)
    response.assertBodyContains({
      account: {
        email: 'jane@example.com',
        fullName: 'Jane Doe',
        organisationName: 'Aqua Swim Organisation',
        school: 'Aqua Swim Organisation',
      },
    })

    const user = await User.findByOrFail('email', 'jane@example.com')
    assert.isTrue(await hash.verify(user.password!, 'supersecret'))
    assert.equal(user.phone, '0240000998')
    assert.notOk(user.mustChangePassword)
  })

  test('rejects a missing phone number', async ({ client }) => {
    const { phone: _phone, ...payload } = validPayload
    const response = await client
      .post('/api/accounts')
      .accept('json')
      .json(payload)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'phone', rule: 'required' }],
    })
  })

  test('rejects a phone number that is not 10 digits', async ({ client }) => {
    const response = await client
      .post('/api/accounts')
      .accept('json')
      .json({ ...validPayload, phone: '024000998' })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'phone', rule: 'regex' }],
    })
  })

  test('rejects a duplicate email', async ({ client }) => {
    await UserFactory.merge({ email: 'jane@example.com' }).create()

    const response = await client.post('/api/accounts').accept('json').json(validPayload)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'email', rule: 'database.unique' }],
    })
  })

  test('rejects a password shorter than 8 characters', async ({ client }) => {
    const response = await client
      .post('/api/accounts')
      .accept('json')
      .json({ ...validPayload, password: 'short' })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'password', rule: 'minLength' }],
    })
  })
})
