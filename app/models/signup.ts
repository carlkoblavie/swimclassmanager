import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { SignupSchema } from '#database/schema'
import School from '#models/school'
import Learner from '#models/learner'
import Purchase from '#models/purchase'

export default class Signup extends SignupSchema {
  @belongsTo(() => School)
  declare school: BelongsTo<typeof School>

  @hasMany(() => Learner)
  declare learners: HasMany<typeof Learner>

  @hasMany(() => Purchase)
  declare purchases: HasMany<typeof Purchase>
}
