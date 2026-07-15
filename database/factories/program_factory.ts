import factory from '@adonisjs/lucid/factories'
import Program from '#models/program'
import { LevelFactory } from './level_factory.js'

export const ProgramFactory = factory
  .define(Program, async ({ faker }) => {
    return {
      name: `${faker.commerce.productName()} ${faker.string.alphanumeric(5)}`,
      description: faker.lorem.sentence(),
    }
  })
  .relation('levels', () => LevelFactory)
  .build()
