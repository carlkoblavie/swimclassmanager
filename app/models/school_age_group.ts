import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { SchoolAgeGroupSchema } from '#database/schema'
import School from '#models/school'

export default class SchoolAgeGroup extends SchoolAgeGroupSchema {
  @belongsTo(() => School)
  declare school: BelongsTo<typeof School>
}
