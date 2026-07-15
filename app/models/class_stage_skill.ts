import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { ClassStageSkillSchema } from '#database/schema'
import ClassStage from '#models/class_stage'
import Skill from '#models/skill'

export default class ClassStageSkill extends ClassStageSkillSchema {
  @belongsTo(() => ClassStage)
  declare classStage: BelongsTo<typeof ClassStage>

  @belongsTo(() => Skill)
  declare skill: BelongsTo<typeof Skill>
}
