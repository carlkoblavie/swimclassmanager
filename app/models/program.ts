import { hasMany, scope } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import { ProgramSchema } from '#database/schema'
import Level from '#models/level'

export default class Program extends ProgramSchema {
  @hasMany(() => Level)
  declare levels: HasMany<typeof Level>

  static active = scope((query) => {
    query.whereNotNull('activatedAt')
  })

  get isActive(): boolean {
    return this.activatedAt !== null
  }

  // One-way draft → active transition; activating an active program is a no-op.
  async activate(): Promise<void> {
    if (this.isActive) {
      return
    }

    this.activatedAt = DateTime.now()
    await this.save()
  }
}
