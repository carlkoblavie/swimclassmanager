import factory from '@adonisjs/lucid/factories'
import SchoolLevelSetting from '#models/school_level_setting'

export const SchoolLevelSettingFactory = factory
  .define(SchoolLevelSetting, async () => {
    return {
      fee: null,
      available: true,
    }
  })
  .build()
