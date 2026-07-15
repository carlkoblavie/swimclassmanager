import factory from '@adonisjs/lucid/factories'
import ClassStage from '#models/class_stage'
import { SwimmingClassFactory } from './swimming_class_factory.js'

export const ClassStageFactory = factory
  .define(ClassStage, async ({ faker, $trx }) => {
    const swimmingClass = $trx
      ? await SwimmingClassFactory.client($trx).create()
      : await SwimmingClassFactory.create()

    return {
      swimmingClassId: swimmingClass.id,
      name: `${faker.word.adjective()} Stage`,
      position: 1,
    }
  })
  .build()
