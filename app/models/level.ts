import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { LevelSchema } from '#database/schema'
import Program from '#models/program'
import SchoolLevelSetting from '#models/school_level_setting'
import SwimmingClass from '#models/swimming_class'

export default class Level extends LevelSchema {
  @belongsTo(() => Program)
  declare program: BelongsTo<typeof Program>

  @hasMany(() => SchoolLevelSetting)
  declare schoolLevelSettings: HasMany<typeof SchoolLevelSetting>

  @hasMany(() => SwimmingClass)
  declare swimmingClasses: HasMany<typeof SwimmingClass>
}
