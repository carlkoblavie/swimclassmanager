import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { SchoolActivityCategorySchema } from '#database/schema'
import School from '#models/school'
import SchoolActivity from '#models/school_activity'

export default class SchoolActivityCategory extends SchoolActivityCategorySchema {
  @belongsTo(() => School)
  declare school: BelongsTo<typeof School>

  @hasMany(() => SchoolActivity)
  declare activities: HasMany<typeof SchoolActivity>
}
