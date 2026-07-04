import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { ClubLevelSettingSchema } from '#database/schema'
import Club from '#models/club'
import Level from '#models/level'

export default class ClubLevelSetting extends ClubLevelSettingSchema {
  // SQLite stores booleans as 0/1; coerce so reads are real booleans and
  // writes bind an integer (better-sqlite3 cannot bind a JS boolean).
  @column({
    consume: (value) => Boolean(value),
    prepare: (value: boolean) => (value ? 1 : 0),
  })
  declare available: boolean

  @belongsTo(() => Club)
  declare club: BelongsTo<typeof Club>

  @belongsTo(() => Level)
  declare level: BelongsTo<typeof Level>
}
