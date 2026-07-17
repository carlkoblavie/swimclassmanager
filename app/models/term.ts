import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { TermSchema } from '#database/schema'
import SwimYear from '#models/swim_year'
import SwimmingClass from '#models/swimming_class'

export default class Term extends TermSchema {
  @belongsTo(() => SwimYear)
  declare swimYear: BelongsTo<typeof SwimYear>

  @hasMany(() => SwimmingClass)
  declare swimmingClasses: HasMany<typeof SwimmingClass>
}
