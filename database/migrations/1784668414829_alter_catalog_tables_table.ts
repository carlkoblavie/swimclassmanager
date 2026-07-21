import { BaseSchema } from '@adonisjs/lucid/schema'
import { randomUUID } from 'node:crypto'

const TABLES = ['programs', 'levels', 'school_level_settings'] as const

export default class extends BaseSchema {
  async up() {
    // Parallel public identifier for public URLs and payment references;
    // integer PKs and FKs are untouched.
    for (const table of TABLES) {
      this.schema.alterTable(table, (t) => {
        t.uuid('public_id').nullable()
      })
    }

    this.defer(async (db) => {
      for (const table of TABLES) {
        const rows = await db.from(table).select('id')
        for (const row of rows) {
          await db.from(table).where('id', row.id).update({ public_id: randomUUID() })
        }
      }
    })

    for (const table of TABLES) {
      this.schema.alterTable(table, (t) => {
        t.unique(['public_id'])
      })
    }
  }

  async down() {
    for (const table of TABLES) {
      this.schema.alterTable(table, (t) => {
        t.dropColumn('public_id')
      })
    }
  }
}
