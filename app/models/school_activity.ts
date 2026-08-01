import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { SchoolActivitySchema } from '#database/schema'
import School from '#models/school'
import SchoolActivityCategory from '#models/school_activity_category'

export default class SchoolActivity extends SchoolActivitySchema {
  @belongsTo(() => School)
  declare school: BelongsTo<typeof School>

  @belongsTo(() => SchoolActivityCategory, { foreignKey: 'schoolActivityCategoryId' })
  declare category: BelongsTo<typeof SchoolActivityCategory>
}
