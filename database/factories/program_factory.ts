import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'
import Program from '#models/program'
import { LevelFactory } from './level_factory.js'

export const ProgramFactory = factory
  .define(Program, async ({ faker }) => {
    return {
      name: `${faker.commerce.productName()} ${faker.string.alphanumeric(5)}`,
      code: `FAC P${faker.string.numeric(6)}`.replace(' ', ''),
      description: faker.lorem.sentence(),
      // Active by default so tests unrelated to the draft flow see a live catalog.
      activatedAt: DateTime.now(),
    }
  })
  .state('draft', (program) => (program.activatedAt = null))
  .relation('levels', () => LevelFactory)
  .build()
