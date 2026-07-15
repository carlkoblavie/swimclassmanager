import { DateTime } from 'luxon'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { InvitationSchema } from '#database/schema'
import School from '#models/school'
import Role from '#models/role'
import SwimmingClass from '#models/swimming_class'

export default class Invitation extends InvitationSchema {
  @belongsTo(() => School)
  declare school: BelongsTo<typeof School>

  @belongsTo(() => Role)
  declare role: BelongsTo<typeof Role>

  @hasMany(() => SwimmingClass, { foreignKey: 'pendingInstructorInvitationId' })
  declare pendingInstructorClasses: HasMany<typeof SwimmingClass>

  get isExpired(): boolean {
    return this.expiresAt < DateTime.now()
  }

  get isPending(): boolean {
    return this.acceptedAt === null
  }
}
