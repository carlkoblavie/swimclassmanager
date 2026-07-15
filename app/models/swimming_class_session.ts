import { DateTime } from 'luxon'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { SwimmingClassSessionSchema } from '#database/schema'
import SwimmingClass from '#models/swimming_class'

export default class SwimmingClassSession extends SwimmingClassSessionSchema {
  @belongsTo(() => SwimmingClass)
  declare swimmingClass: BelongsTo<typeof SwimmingClass>

  get isCancelled(): boolean {
    return this.cancelledAt !== null
  }

  cancel() {
    this.cancelledAt = DateTime.now()
  }
}
