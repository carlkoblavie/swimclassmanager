import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'
import SwimmingClass from '#models/swimming_class'
import LevelStage from '#models/level_stage'
import { LevelFactory } from './level_factory.js'
import { SchoolFactory } from './school_factory.js'

export const SwimmingClassFactory = factory
  .define(SwimmingClass, async ({ faker, $trx }) => {
    const school = $trx ? await SchoolFactory.client($trx).create() : await SchoolFactory.create()
    const level = $trx
      ? await LevelFactory.client($trx).merge({ capacity: 12 }).create()
      : await LevelFactory.merge({ capacity: 12 }).create()
    const stage = await LevelStage.create(
      {
        levelId: level.id,
        code: `L00ST${faker.string.numeric(6)}`,
        name: 'Foundations',
        position: 1,
        classesCount: 10,
        description: null,
      },
      $trx ? { client: $trx } : undefined
    )

    return {
      schoolId: school.id,
      levelId: level.id,
      levelStageId: stage.id,
      code: `ST00CL${faker.string.numeric(6)}`,
      name: `${faker.word.adjective()} Swim Class ${faker.string.alphanumeric(4)}`,
      weekday: 1,
      startTime: '09:00',
      durationMinutes: 45,
      location: null,
    }
  })
  .state('cancelled', (swimmingClass) => {
    swimmingClass.cancelledAt = DateTime.now()
  })
  .build()
