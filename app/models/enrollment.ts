import { beforeCreate, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import { EnrollmentSchema } from '#database/schema'
import School from '#models/school'
import Level from '#models/level'
import SwimYear from '#models/swim_year'
import Learner from '#models/learner'
import TermPayment from '#models/term_payment'
import SwimmingClass from '#models/swimming_class'
import Term from '#models/term'
import ClassLesson from '#models/class_lesson'
import EnrollmentStage from '#models/enrollment_stage'

export default class Enrollment extends EnrollmentSchema {
  @beforeCreate()
  static assignPublicId(enrollment: Enrollment) {
    if (!enrollment.publicId) {
      enrollment.publicId = randomUUID()
    }
  }

  @belongsTo(() => School)
  declare school: BelongsTo<typeof School>

  @belongsTo(() => Level)
  declare level: BelongsTo<typeof Level>

  @belongsTo(() => SwimYear)
  declare swimYear: BelongsTo<typeof SwimYear>

  @belongsTo(() => Learner)
  declare learner: BelongsTo<typeof Learner>

  @belongsTo(() => SwimmingClass)
  declare swimmingClass: BelongsTo<typeof SwimmingClass>

  @belongsTo(() => Term)
  declare term: BelongsTo<typeof Term>

  @hasMany(() => TermPayment)
  declare termPayments: HasMany<typeof TermPayment>

  @hasMany(() => EnrollmentStage)
  declare enrollmentStages: HasMany<typeof EnrollmentStage>

  @manyToMany(() => ClassLesson, {
    pivotTable: 'enrollment_lessons',
    pivotForeignKey: 'enrollment_id',
    pivotRelatedForeignKey: 'class_lesson_id',
    pivotTimestamps: true,
  })
  declare lessons: ManyToMany<typeof ClassLesson>
}
