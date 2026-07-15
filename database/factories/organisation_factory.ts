import factory from '@adonisjs/lucid/factories'
import Organisation from '#models/organisation'
import User from '#models/user'

export const OrganisationFactory = factory
  .define(Organisation, async ({ faker, $trx }) => {
    const creator = await User.create(
      {
        email: faker.internet.email(),
      },
      $trx ? { client: $trx } : undefined
    )
    const name = faker.company.name()

    return {
      name,
      slug: `${name}-${faker.string.alphanumeric(6)}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
      isPremium: false,
      createdByUserId: creator.id,
    }
  })
  .state('premium', (organisation) => {
    organisation.isPremium = true
  })
  .build()
