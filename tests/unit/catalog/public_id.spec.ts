import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Program from '#models/program'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

test.group('Catalog public ids', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('a created program is assigned a uuid public id', async ({ assert }) => {
    const program = await Program.create({ name: 'LTS', code: 'ZZP000001', description: 'x' })
    assert.match(program.publicId ?? '', UUID_RE)
  })

  test('a created level is assigned a uuid public id', async ({ assert }) => {
    const program = await Program.create({ name: 'LTS2', code: 'ZZP000002', description: 'x' })
    const level = await program.related('levels').create({
      code: 'ZZL000001',
      name: 'Beginner',
      ageGroup: '4-7',
      description: 'x',
      defaultFee: 5000,
    })
    assert.match(level.publicId ?? '', UUID_RE)
  })
})
