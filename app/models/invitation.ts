import { DateTime } from 'luxon'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { InvitationSchema } from '#database/schema'
import Club from '#models/club'
import Role from '#models/role'

export default class Invitation extends InvitationSchema {
  @belongsTo(() => Club)
  declare club: BelongsTo<typeof Club>

  @belongsTo(() => Role)
  declare role: BelongsTo<typeof Role>

  get isExpired(): boolean {
    return this.expiresAt < DateTime.now()
  }

  get isPending(): boolean {
    return this.acceptedAt === null
  }
}
