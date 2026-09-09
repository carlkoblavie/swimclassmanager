import { DateTime } from 'luxon'
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { InvitationSchema } from '#database/schema'
import School from '#models/school'
import Role from '#models/role'
import StageInstructor from '#models/stage_instructor'

export default class Invitation extends InvitationSchema {
  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: unknown) => (typeof value === 'string' ? JSON.parse(value) : (value ?? null)),
  })
  declare certifications: string[] | null

  @belongsTo(() => School)
  declare school: BelongsTo<typeof School>

  @belongsTo(() => Role)
  declare role: BelongsTo<typeof Role>

  @hasMany(() => StageInstructor)
  declare stageInstructors: HasMany<typeof StageInstructor>

  get inviteeFullName(): string | null {
    const name = [this.inviteeFirstName, this.inviteeLastName]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(' ')
    return name || null
  }

  get isExpired(): boolean {
    return this.expiresAt < DateTime.now()
  }

  get isPending(): boolean {
    return this.acceptedAt === null
  }
}
