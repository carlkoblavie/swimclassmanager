import factory from '@adonisjs/lucid/factories'
import School from '#models/school'

export const SchoolFactory = factory
  .define(School, async ({ faker }) => {
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
