import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { LevelStageActivitySchema } from '#database/schema'
import LevelStageSkill from '#models/level_stage_skill'

export default class LevelStageActivity extends LevelStageActivitySchema {
  @belongsTo(() => LevelStageSkill)
  declare levelStageSkill: BelongsTo<typeof LevelStageSkill>
}
