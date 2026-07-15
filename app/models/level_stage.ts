import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { LevelStageSchema } from '#database/schema'
import Level from '#models/level'

export default class LevelStage extends LevelStageSchema {
  @belongsTo(() => Level)
  declare level: BelongsTo<typeof Level>
}
