import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { PurchaseItemSchema } from '#database/schema'
import Purchase from '#models/purchase'
import Enrollment from '#models/enrollment'
import Learner from '#models/learner'
import Level from '#models/level'

export default class PurchaseItem extends PurchaseItemSchema {
  @belongsTo(() => Purchase)
  declare purchase: BelongsTo<typeof Purchase>

  @belongsTo(() => Enrollment)
  declare enrollment: BelongsTo<typeof Enrollment>

  @belongsTo(() => Learner)
  declare learner: BelongsTo<typeof Learner>

  @belongsTo(() => Level)
  declare level: BelongsTo<typeof Level>
}
