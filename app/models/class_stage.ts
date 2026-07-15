import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { ClassStageSchema } from '#database/schema'
import SwimmingClass from '#models/swimming_class'
import ClassStageSkill from '#models/class_stage_skill'
import Skill from '#models/skill'

export default class ClassStage extends ClassStageSchema {
  @belongsTo(() => SwimmingClass)
  declare swimmingClass: BelongsTo<typeof SwimmingClass>

  @hasMany(() => ClassStageSkill)
  declare classStageSkills: HasMany<typeof ClassStageSkill>

  @manyToMany(() => Skill, {
    pivotTable: 'class_stage_skills',
    pivotForeignKey: 'class_stage_id',
    pivotRelatedForeignKey: 'skill_id',
  })
  declare skills: ManyToMany<typeof Skill>
}
