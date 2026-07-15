import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'
import SwimmingClassSession from '#models/swimming_class_session'
import { SwimmingClassFactory } from './swimming_class_factory.js'

export const SwimmingClassSessionFactory = factory
  .define(SwimmingClassSession, async ({ $trx }) => {
    const swimmingClass = $trx
      ? await SwimmingClassFactory.client($trx).create()
      : await SwimmingClassFactory.create()
    const startsAt = DateTime.now().plus({ days: 1 }).set({ hour: 9, minute: 0, second: 0 })

    return {
      swimmingClassId: swimmingClass.id,
      startsAt,
      endsAt: startsAt.plus({ hours: 1 }),
    }
  })
  .state('cancelled', (session) => {
    session.cancelledAt = DateTime.now()
  })
  .state('past', (session) => {
    const startsAt = DateTime.now().minus({ days: 7 }).set({ hour: 9, minute: 0, second: 0 })
    session.startsAt = startsAt
    session.endsAt = startsAt.plus({ hours: 1 })
  })
  .state('future', (session) => {
    const startsAt = DateTime.now().plus({ days: 7 }).set({ hour: 9, minute: 0, second: 0 })
    session.startsAt = startsAt
    session.endsAt = startsAt.plus({ hours: 1 })
  })
  .build()
