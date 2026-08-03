import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import { PaymentTransactionSchema } from '#database/schema'
import Purchase from '#models/purchase'
import TermPayment from '#models/term_payment'

export default class PaymentTransaction extends PaymentTransactionSchema {
  @beforeCreate()
  static assignPublicId(transaction: PaymentTransaction) {
    if (!transaction.publicId) {
      transaction.publicId = randomUUID()
    }
  }

  @belongsTo(() => Purchase)
  declare purchase: BelongsTo<typeof Purchase>

  @hasMany(() => TermPayment)
  declare termPayments: HasMany<typeof TermPayment>
}
