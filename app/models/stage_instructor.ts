import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { StageInstructorSchema } from '#database/schema'
import Invitation from '#models/invitation'
import LevelStage from '#models/level_stage'
import Membership from '#models/membership'
import School from '#models/school'

/**
 * One instructor on a curriculum stage for a specific school: either an
 * accepted membership or a pending teacher invitation (exactly one is set).
 * A stage carries one lead and any number of assistants; its classes and
 * lessons follow this staffing.
 */
export default class StageInstructor extends StageInstructorSchema {
  @belongsTo(() => School)
  declare school: BelongsTo<typeof School>

  @belongsTo(() => LevelStage)
  declare levelStage: BelongsTo<typeof LevelStage>

  @belongsTo(() => Membership)
  declare membership: BelongsTo<typeof Membership>

  @belongsTo(() => Invitation)
  declare invitation: BelongsTo<typeof Invitation>
}
