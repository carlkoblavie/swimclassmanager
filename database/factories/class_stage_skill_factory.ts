import factory from '@adonisjs/lucid/factories'
import ClassStageSkill from '#models/class_stage_skill'
import { ClassStageFactory } from './class_stage_factory.js'
import { SkillFactory } from './skill_factory.js'

export const ClassStageSkillFactory = factory
  .define(ClassStageSkill, async ({ $trx }) => {
    const classStage = $trx
      ? await ClassStageFactory.client($trx).create()
      : await ClassStageFactory.create()
    const skill = $trx ? await SkillFactory.client($trx).create() : await SkillFactory.create()

    return {
      classStageId: classStage.id,
      skillId: skill.id,
    }
  })
  .build()
