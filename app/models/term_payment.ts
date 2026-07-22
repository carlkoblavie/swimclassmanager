import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import { TermPaymentSchema } from '#database/schema'
import Enrollment from '#models/enrollment'
import Term from '#models/term'

export default class TermPayment extends TermPaymentSchema {
  @beforeCreate()
  static assignPublicId(payment: TermPayment) {
    if (!payment.publicId) {
      payment.publicId = randomUUID()
    }
  }

  @belongsTo(() => Enrollment)
  declare enrollment: BelongsTo<typeof Enrollment>

  @belongsTo(() => Term)
  declare term: BelongsTo<typeof Term>
}
