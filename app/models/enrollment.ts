import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import { EnrollmentSchema } from '#database/schema'
import School from '#models/school'
import Level from '#models/level'
import SwimYear from '#models/swim_year'
import Learner from '#models/learner'
import TermPayment from '#models/term_payment'

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

  @hasMany(() => TermPayment)
  declare termPayments: HasMany<typeof TermPayment>
}
