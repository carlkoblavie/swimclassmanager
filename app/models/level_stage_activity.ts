import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { LevelStageActivitySchema } from '#database/schema'
import LevelStage from '#models/level_stage'

export default class LevelStageActivity extends LevelStageActivitySchema {
  @belongsTo(() => LevelStage)
  declare levelStage: BelongsTo<typeof LevelStage>
}
