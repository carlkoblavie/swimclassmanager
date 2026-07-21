import { beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import { SchoolLevelSettingSchema } from '#database/schema'
import School from '#models/school'
import Level from '#models/level'

export default class SchoolLevelSetting extends SchoolLevelSettingSchema {
  @beforeCreate()
  static assignPublicId(setting: SchoolLevelSetting) {
    if (!setting.publicId) {
      setting.publicId = randomUUID()
    }
  }

  // SQLite stores booleans as 0/1; coerce so reads are real booleans and
  // writes bind an integer (better-sqlite3 cannot bind a JS boolean).
  @column({
    consume: (value) => Boolean(value),
    prepare: (value: boolean) => (value ? 1 : 0),
  })
  declare available: boolean

  @belongsTo(() => School)
  declare school: BelongsTo<typeof School>

  @belongsTo(() => Level)
  declare level: BelongsTo<typeof Level>
}
