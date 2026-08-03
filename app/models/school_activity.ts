import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { SchoolActivitySchema } from '#database/schema'
import Level from '#models/level'
import LevelStage from '#models/level_stage'
import LevelStageActivity from '#models/level_stage_activity'
import LevelStageSkill from '#models/level_stage_skill'
import School from '#models/school'
import SchoolActivityCategory from '#models/school_activity_category'

export default class SchoolActivity extends SchoolActivitySchema {
  @belongsTo(() => School)
  declare school: BelongsTo<typeof School>

  @belongsTo(() => SchoolActivityCategory, { foreignKey: 'schoolActivityCategoryId' })
  declare category: BelongsTo<typeof SchoolActivityCategory>

  @belongsTo(() => Level)
  declare level: BelongsTo<typeof Level>

  @belongsTo(() => LevelStage)
  declare levelStage: BelongsTo<typeof LevelStage>

  @belongsTo(() => LevelStageSkill)
  declare levelStageSkill: BelongsTo<typeof LevelStageSkill>

  @belongsTo(() => LevelStageActivity)
  declare levelStageActivity: BelongsTo<typeof LevelStageActivity>
}
