import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import ProgramAuthoringService from '#services/program_authoring_service'
import Level from '#models/level'

test.group('Level audience', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('create persists the submitted audience', async ({ assert }) => {
    await new ProgramAuthoringService().create(
      {
        name: 'Learn To Swim',
        description: 'x',
        levels: [
          {
            name: 'Adult Beginner',
            ageGroup: '18+',
            description: 'x',
            defaultFee: 50,
            classesCount: 8,
            audience: 'adult',
            stages: [],
          },
        ],
      },
      'Gaia'
    )

    const level = await Level.findByOrFail('name', 'Adult Beginner')
    assert.equal(level.audience, 'adult')
  })
})
