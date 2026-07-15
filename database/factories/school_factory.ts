import factory from '@adonisjs/lucid/factories'
import Organisation from '#models/organisation'
import School from '#models/school'
import User from '#models/user'

export const SchoolFactory = factory
  .define(School, async ({ faker, $trx }) => {
    const creator = await User.create(
      {
        email: faker.internet.email(),
      },
      $trx ? { client: $trx } : undefined
    )
    const organisationName = faker.company.name()
    const organisation = await Organisation.create(
      {
        name: organisationName,
        slug: `${organisationName}-${faker.string.alphanumeric(6)}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
        isPremium: false,
        createdByUserId: creator.id,
      },
      $trx ? { client: $trx } : undefined
    )
    const name = faker.company.name()

    return {
      name,
      location: faker.location.city(),
      slug: `${name}-${faker.string.alphanumeric(6)}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
      organisationId: organisation.id,
      createdByUserId: creator.id,
    }
  })
  .build()
