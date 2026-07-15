import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { SchoolSchema } from '#database/schema'
import User from '#models/user'
import Membership from '#models/membership'
import Invitation from '#models/invitation'
import Signup from '#models/signup'
import SchoolLevelSetting from '#models/school_level_setting'
import Organisation from '#models/organisation'
import SwimmingClass from '#models/swimming_class'

export default class School extends SchoolSchema {
  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare creator: BelongsTo<typeof User>

  @belongsTo(() => Organisation)
  declare organisation: BelongsTo<typeof Organisation>

  @hasMany(() => Membership)
  declare memberships: HasMany<typeof Membership>

  @hasMany(() => Invitation)
  declare invitations: HasMany<typeof Invitation>

  @hasMany(() => Signup)
  declare signups: HasMany<typeof Signup>

  @hasMany(() => SchoolLevelSetting)
  declare levelSettings: HasMany<typeof SchoolLevelSetting>

  @hasMany(() => SwimmingClass)
  declare swimmingClasses: HasMany<typeof SwimmingClass>
}
