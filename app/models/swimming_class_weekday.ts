import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { SwimmingClassWeekdaySchema } from '#database/schema'
import SwimmingClass from '#models/swimming_class'

export default class SwimmingClassWeekday extends SwimmingClassWeekdaySchema {
  @belongsTo(() => SwimmingClass)
  declare swimmingClass: BelongsTo<typeof SwimmingClass>
}
