import factory from '@adonisjs/lucid/factories'
import SchoolLevelSetting from '#models/school_level_setting'
import { LevelFactory } from './level_factory.js'
import { SchoolFactory } from './school_factory.js'

export const SchoolLevelSettingFactory = factory
  .define(SchoolLevelSetting, async ({ $trx }) => {
    const school = $trx ? await SchoolFactory.client($trx).create() : await SchoolFactory.create()
    const level = $trx ? await LevelFactory.client($trx).create() : await LevelFactory.create()

    return {
      schoolId: school.id,
      levelId: level.id,
      fee: null,
      available: true,
    }
  })
  .build()
