import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { ClassSkillSchema } from '#database/schema'
import SwimmingClass from '#models/swimming_class'
import LevelStageSkill from '#models/level_stage_skill'

export default class ClassSkill extends ClassSkillSchema {
  @belongsTo(() => SwimmingClass)
  declare swimmingClass: BelongsTo<typeof SwimmingClass>

  @belongsTo(() => LevelStageSkill)
  declare levelStageSkill: BelongsTo<typeof LevelStageSkill>
}
