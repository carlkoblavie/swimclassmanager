import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { LevelStageSchema } from '#database/schema'
import Level from '#models/level'
import LevelStageSkill from '#models/level_stage_skill'
import StageInstructor from '#models/stage_instructor'
import SwimmingClass from '#models/swimming_class'

export default class LevelStage extends LevelStageSchema {
  @belongsTo(() => Level)
  declare level: BelongsTo<typeof Level>

  @hasMany(() => LevelStageSkill)
  declare skills: HasMany<typeof LevelStageSkill>

  @hasMany(() => StageInstructor)
  declare stageInstructors: HasMany<typeof StageInstructor>

  @hasMany(() => SwimmingClass)
  declare swimmingClasses: HasMany<typeof SwimmingClass>
}
