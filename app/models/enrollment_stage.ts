import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { EnrollmentStageSchema } from '#database/schema'
import Enrollment from '#models/enrollment'
import LevelStage from '#models/level_stage'

/**
 * One stage a learner (via their enrollment) is assigned to. Stages are
 * progressive: exactly one is `current`, earlier ones `completed`, later ones
 * `upcoming`. A learner finishes a stage's classes/lessons to advance.
 */
export default class EnrollmentStage extends EnrollmentStageSchema {
  @belongsTo(() => Enrollment)
  declare enrollment: BelongsTo<typeof Enrollment>

  @belongsTo(() => LevelStage)
  declare levelStage: BelongsTo<typeof LevelStage>
}
