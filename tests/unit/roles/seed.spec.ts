import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { seedRoles } from '#tests/helpers'
import { RoleName } from '#values/role'
import Role from '#models/role'

test.group('Roles catalog', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('contains the six defined roles', async ({ assert }) => {
    const roles = await Role.query()
    const names = roles.map((role) => role.name).sort()

    assert.lengthOf(roles, 6)
    assert.deepEqual(names, [...Object.values(RoleName)].sort())
  })
})
