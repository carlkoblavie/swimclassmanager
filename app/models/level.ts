import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import { LevelSchema } from '#database/schema'
import LevelStage from '#models/level_stage'
import Program from '#models/program'
import SchoolLevelSetting from '#models/school_level_setting'
import SwimmingClass from '#models/swimming_class'

export default class Level extends LevelSchema {
  @beforeCreate()
  static assignPublicId(level: Level) {
    if (!level.publicId) {
      level.publicId = randomUUID()
    }
  }

  @belongsTo(() => Program)
  declare program: BelongsTo<typeof Program>

  @hasMany(() => LevelStage)
  declare stages: HasMany<typeof LevelStage>

  @hasMany(() => SchoolLevelSetting)
  declare schoolLevelSettings: HasMany<typeof SchoolLevelSetting>

  @hasMany(() => SwimmingClass)
  declare swimmingClasses: HasMany<typeof SwimmingClass>
}
