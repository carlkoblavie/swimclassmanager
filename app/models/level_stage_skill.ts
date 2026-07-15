import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { LevelStageSkillSchema } from '#database/schema'
import LevelStage from '#models/level_stage'

export default class LevelStageSkill extends LevelStageSkillSchema {
  @belongsTo(() => LevelStage)
  declare levelStage: BelongsTo<typeof LevelStage>
}
