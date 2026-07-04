import factory from '@adonisjs/lucid/factories'
import Club from '#models/club'

export const ClubFactory = factory
  .define(Club, async ({ faker }) => {
    const name = faker.company.name()
    return {
      name,
      location: faker.location.city(),
      slug: `${name}-${faker.string.alphanumeric(6)}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    }
  })
  .build()
