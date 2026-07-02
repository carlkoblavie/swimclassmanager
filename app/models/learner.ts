import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { LearnerSchema } from '#database/schema'
import Signup from '#models/signup'

export default class Learner extends LearnerSchema {
  @belongsTo(() => Signup)
  declare signup: BelongsTo<typeof Signup>
}
