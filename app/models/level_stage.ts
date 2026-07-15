import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { LevelStageSchema } from '#database/schema'
import Level from '#models/level'
import LevelStageSkill from '#models/level_stage_skill'

export default class LevelStage extends LevelStageSchema {
  @belongsTo(() => Level)
  declare level: BelongsTo<typeof Level>

  @hasMany(() => LevelStageSkill)
  declare skills: HasMany<typeof LevelStageSkill>
}
