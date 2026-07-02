import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { ClubSchema } from '#database/schema'
import User from '#models/user'
import Membership from '#models/membership'

export default class Club extends ClubSchema {
  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare creator: BelongsTo<typeof User>

  @hasMany(() => Membership)
  declare memberships: HasMany<typeof Membership>
}
