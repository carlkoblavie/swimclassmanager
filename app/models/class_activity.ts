import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { ClassActivitySchema } from '#database/schema'
import SwimmingClass from '#models/swimming_class'
import LevelStageActivity from '#models/level_stage_activity'

export default class ClassActivity extends ClassActivitySchema {
  @belongsTo(() => SwimmingClass)
  declare swimmingClass: BelongsTo<typeof SwimmingClass>

  @belongsTo(() => LevelStageActivity)
  declare levelStageActivity: BelongsTo<typeof LevelStageActivity>
}
