import { belongsTo, column, hasMany, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { SkillSchema } from '#database/schema'
import School from '#models/school'
import User from '#models/user'
import ClassStageSkill from '#models/class_stage_skill'

export default class Skill extends SkillSchema {
  // SQLite stores booleans as 0/1; coerce reads and bind writes safely.
  @column({
    consume: (value) => Boolean(value),
    prepare: (value: boolean) => (value ? 1 : 0),
  })
  declare isDefault: boolean

  @belongsTo(() => School)
  declare school: BelongsTo<typeof School>

  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare creator: BelongsTo<typeof User>

  @hasMany(() => ClassStageSkill)
  declare classStageSkills: HasMany<typeof ClassStageSkill>

  static availableToSchool = scope((query, school: School) => {
    query.where('schoolId', school.id)

    if (school.organisation?.isPremium) {
      query.orWhere((defaultSkills) => {
        defaultSkills.whereNull('schoolId').where('isDefault', 1)
      })
    }
  })
}
