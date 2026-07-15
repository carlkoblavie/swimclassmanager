import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { LevelStageSkillSchema } from '#database/schema'
import LevelStage from '#models/level_stage'
import LevelStageActivity from '#models/level_stage_activity'

export default class LevelStageSkill extends LevelStageSkillSchema {
  @belongsTo(() => LevelStage)
  declare levelStage: BelongsTo<typeof LevelStage>

  @hasMany(() => LevelStageActivity)
  declare activities: HasMany<typeof LevelStageActivity>
}
