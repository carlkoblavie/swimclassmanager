import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { ClubSchema } from '#database/schema'
import User from '#models/user'
import Membership from '#models/membership'
import Invitation from '#models/invitation'
import Signup from '#models/signup'
import ClubLevelSetting from '#models/club_level_setting'

export default class Club extends ClubSchema {
  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare creator: BelongsTo<typeof User>

  @hasMany(() => Membership)
  declare memberships: HasMany<typeof Membership>

  @hasMany(() => Invitation)
  declare invitations: HasMany<typeof Invitation>

  @hasMany(() => Signup)
  declare signups: HasMany<typeof Signup>

  @hasMany(() => ClubLevelSetting)
  declare levelSettings: HasMany<typeof ClubLevelSetting>
}
