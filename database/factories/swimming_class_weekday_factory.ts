import factory from '@adonisjs/lucid/factories'
import SwimmingClassWeekday from '#models/swimming_class_weekday'
import { SwimmingClassFactory } from './swimming_class_factory.js'

export const SwimmingClassWeekdayFactory = factory
  .define(SwimmingClassWeekday, async ({ $trx }) => {
    const swimmingClass = $trx
      ? await SwimmingClassFactory.client($trx).create()
      : await SwimmingClassFactory.create()

    return {
      swimmingClassId: swimmingClass.id,
      weekday: 1,
    }
  })
  .build()
