import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import { SwimYearSchema } from '#database/schema'
import School from '#models/school'
import Term from '#models/term'

export type SwimYearStatus = 'upcoming' | 'current' | 'archived'

export default class SwimYear extends SwimYearSchema {
  @belongsTo(() => School)
  declare school: BelongsTo<typeof School>

  @hasMany(() => Term)
  declare terms: HasMany<typeof Term>

  // Status is derived purely from today's date: no stored state to maintain.
  get status(): SwimYearStatus {
    const today = DateTime.now().startOf('day')
    if (today < this.startsOn.startOf('day')) {
      return 'upcoming'
    }
    if (today > this.endsOn.startOf('day')) {
      return 'archived'
    }
    return 'current'
  }
}
