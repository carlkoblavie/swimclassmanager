import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'
import SwimmingClass from '#models/swimming_class'
import { LevelFactory } from './level_factory.js'
import { SchoolFactory } from './school_factory.js'

export const SwimmingClassFactory = factory
  .define(SwimmingClass, async ({ faker, $trx }) => {
    const school = $trx ? await SchoolFactory.client($trx).create() : await SchoolFactory.create()
    const level = $trx
      ? await LevelFactory.client($trx).merge({ capacity: 12 }).create()
      : await LevelFactory.merge({ capacity: 12 }).create()

    return {
      schoolId: school.id,
      levelId: level.id,
      code: `CLS-${faker.string.alphanumeric(6).toUpperCase()}`,
      name: `${faker.word.adjective()} Swim Class`,
      startDate: DateTime.now().plus({ days: 1 }),
      endDate: DateTime.now().plus({ days: 28 }),
      startTime: '09:00',
      endTime: '10:00',
      capacity: 10,
      location: faker.location.streetAddress(),
    }
  })
  .state('cancelled', (swimmingClass) => {
    swimmingClass.cancelledAt = DateTime.now()
  })
  .build()
