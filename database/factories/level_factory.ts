import factory from '@adonisjs/lucid/factories'
import Level from '#models/level'
import Program from '#models/program'

export const LevelFactory = factory
  .define(Level, async ({ faker, $trx }) => {
    const program = await Program.create(
      {
        name: `${faker.commerce.productName()} ${faker.string.alphanumeric(5)}`,
        code: `ZZP${faker.string.numeric(6)}`,
        description: faker.lorem.sentence(),
      },
      $trx ? { client: $trx } : undefined
    )

    return {
      code: `P00L${faker.string.numeric(6)}`,
      programId: program.id,
      name: `${faker.commerce.productAdjective()} ${faker.string.alphanumeric(4)}`,
      ageGroup: '4-7',
      description: faker.lorem.sentence(),
      defaultFee: 5000,
      capacity: 10,
    }
  })
  .build()
