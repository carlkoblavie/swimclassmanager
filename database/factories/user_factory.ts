import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'
import User from '#models/user'

export const UserFactory = factory
  .define(User, async ({ faker }) => {
    return {
      email: faker.internet.email(),
    }
  })
  .state('completed', (user, { faker }) => {
    user.fullName = faker.person.fullName()
    user.phone = faker.string.numeric(10)
    user.country = 'Ghana'
    user.profileCompletedAt = DateTime.now()
  })
  .build()
