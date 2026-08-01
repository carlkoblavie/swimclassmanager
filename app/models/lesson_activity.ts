import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { LessonActivitySchema } from '#database/schema'
import ClassLesson from '#models/class_lesson'
import LevelStageActivity from '#models/level_stage_activity'
import SchoolActivity from '#models/school_activity'

export default class LessonActivity extends LessonActivitySchema {
  @belongsTo(() => ClassLesson)
  declare classLesson: BelongsTo<typeof ClassLesson>

  @belongsTo(() => LevelStageActivity)
  declare levelStageActivity: BelongsTo<typeof LevelStageActivity>

  @belongsTo(() => SchoolActivity)
  declare schoolActivity: BelongsTo<typeof SchoolActivity>
}
