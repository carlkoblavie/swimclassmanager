import factory from '@adonisjs/lucid/factories'
import ClubLevelSetting from '#models/club_level_setting'

export const ClubLevelSettingFactory = factory
  .define(ClubLevelSetting, async () => {
    return {
      fee: null,
      available: true,
    }
  })
  .build()
