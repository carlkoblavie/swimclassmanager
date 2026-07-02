import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'
import string from '@adonisjs/core/helpers/string'
import Invitation from '#models/invitation'

export const InvitationFactory = factory
  .define(Invitation, async ({ faker }) => {
    return {
      email: faker.internet.email(),
      token: string.random(48),
      expiresAt: DateTime.now().plus({ days: 7 }),
    }
  })
  .state('expired', (invitation) => {
    invitation.expiresAt = DateTime.now().minus({ days: 1 })
  })
  .state('accepted', (invitation) => {
    invitation.acceptedAt = DateTime.now()
  })
  .build()
