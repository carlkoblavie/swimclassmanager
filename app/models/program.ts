import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { ProgramSchema } from '#database/schema'
import Level from '#models/level'

export default class Program extends ProgramSchema {
  @hasMany(() => Level)
  declare levels: HasMany<typeof Level>
}
