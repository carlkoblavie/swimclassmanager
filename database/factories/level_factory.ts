import factory from '@adonisjs/lucid/factories'
import Level from '#models/level'

export const LevelFactory = factory
  .define(Level, async ({ faker }) => {
    return {
      name: `${faker.commerce.productAdjective()} ${faker.string.alphanumeric(4)}`,
      ageGroup: '4-7',
      description: faker.lorem.sentence(),
      defaultFee: 5000,
      capacity: 10,
    }
  })
  .build()
