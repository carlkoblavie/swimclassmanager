import { DateTime } from 'luxon'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { InvitationSchema } from '#database/schema'
import School from '#models/school'
import Role from '#models/role'

export default class Invitation extends InvitationSchema {
  @belongsTo(() => School)
  declare school: BelongsTo<typeof School>

  @belongsTo(() => Role)
  declare role: BelongsTo<typeof Role>

  get isExpired(): boolean {
    return this.expiresAt < DateTime.now()
  }

  get isPending(): boolean {
    return this.acceptedAt === null
  }
}
