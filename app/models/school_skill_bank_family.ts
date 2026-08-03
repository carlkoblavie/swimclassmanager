import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { SchoolSkillBankFamilySchema } from '#database/schema'
import School from '#models/school'

export default class SchoolSkillBankFamily extends SchoolSkillBankFamilySchema {
  @belongsTo(() => School)
  declare school: BelongsTo<typeof School>
}
