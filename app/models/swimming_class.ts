import { DateTime } from 'luxon'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { SwimmingClassSchema } from '#database/schema'
import School from '#models/school'
import Level from '#models/level'
import LevelStage from '#models/level_stage'
import ClassLesson from '#models/class_lesson'
import ClassSkill from '#models/class_skill'
import Enrollment from '#models/enrollment'
import Term from '#models/term'

export default class SwimmingClass extends SwimmingClassSchema {
  @belongsTo(() => Term)
  declare term: BelongsTo<typeof Term>

  @belongsTo(() => School)
  declare school: BelongsTo<typeof School>

  @belongsTo(() => Level)
  declare level: BelongsTo<typeof Level>

  @belongsTo(() => LevelStage)
  declare levelStage: BelongsTo<typeof LevelStage>

  @belongsTo(() => LevelStage, { foreignKey: 'prerequisiteStageId' })
  declare prerequisiteStage: BelongsTo<typeof LevelStage>

  @hasMany(() => ClassSkill)
  declare classSkills: HasMany<typeof ClassSkill>

  @hasMany(() => Enrollment)
  declare enrollments: HasMany<typeof Enrollment>

  @hasMany(() => ClassLesson)
  declare lessons: HasMany<typeof ClassLesson>

  get isCancelled(): boolean {
    return this.cancelledAt !== null
  }

  cancel() {
    this.cancelledAt = DateTime.now()
  }
}
