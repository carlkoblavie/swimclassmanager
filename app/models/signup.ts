import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { SignupSchema } from '#database/schema'
import Club from '#models/club'
import Learner from '#models/learner'

export default class Signup extends SignupSchema {
  @belongsTo(() => Club)
  declare club: BelongsTo<typeof Club>

  @hasMany(() => Learner)
  declare learners: HasMany<typeof Learner>
}
