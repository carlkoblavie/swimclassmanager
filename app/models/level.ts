import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { LevelSchema } from '#database/schema'
import Program from '#models/program'
import ClubLevelSetting from '#models/club_level_setting'

export default class Level extends LevelSchema {
  @belongsTo(() => Program)
  declare program: BelongsTo<typeof Program>

  @hasMany(() => ClubLevelSetting)
  declare clubLevelSettings: HasMany<typeof ClubLevelSetting>
}
