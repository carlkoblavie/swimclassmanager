import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { LevelStageSchema } from '#database/schema'
import Level from '#models/level'
import LevelStageSkill from '#models/level_stage_skill'
import SwimmingClass from '#models/swimming_class'

export default class LevelStage extends LevelStageSchema {
  @belongsTo(() => Level)
  declare level: BelongsTo<typeof Level>

  @hasMany(() => LevelStageSkill)
  declare skills: HasMany<typeof LevelStageSkill>

  @hasMany(() => SwimmingClass)
  declare swimmingClasses: HasMany<typeof SwimmingClass>
}
