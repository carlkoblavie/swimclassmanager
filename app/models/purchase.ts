import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import { PurchaseSchema } from '#database/schema'
import School from '#models/school'
import Signup from '#models/signup'
import SwimYear from '#models/swim_year'
import PurchaseItem from '#models/purchase_item'
import PaymentTransaction from '#models/payment_transaction'

export default class Purchase extends PurchaseSchema {
  @beforeCreate()
  static assignPublicId(purchase: Purchase) {
    if (!purchase.publicId) {
      purchase.publicId = randomUUID()
    }
  }

  @belongsTo(() => School)
  declare school: BelongsTo<typeof School>

  @belongsTo(() => Signup)
  declare signup: BelongsTo<typeof Signup>

  @belongsTo(() => SwimYear)
  declare swimYear: BelongsTo<typeof SwimYear>

  @hasMany(() => PurchaseItem)
  declare items: HasMany<typeof PurchaseItem>

  @hasMany(() => PaymentTransaction)
  declare transactions: HasMany<typeof PaymentTransaction>
}
