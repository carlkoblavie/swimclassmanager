import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { LearnerSchema } from '#database/schema'
import Signup from '#models/signup'
import Enrollment from '#models/enrollment'

export default class Learner extends LearnerSchema {
  @belongsTo(() => Signup)
  declare signup: BelongsTo<typeof Signup>

  @hasMany(() => Enrollment)
  declare enrollments: HasMany<typeof Enrollment>
}
