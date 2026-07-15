import { BaseSchema } from '@adonisjs/lucid/schema'
import { DateTime } from 'luxon'

export default class extends BaseSchema {
  protected tableName = 'programs'

  async up() {
    // The activated_at backfill wrote ISO-8601 strings ("...T...Z"), which
    // Lucid's SQL-format date parsing rejects. Rewrite them in SQL format.
    this.defer(async (db) => {
      const rows = await db
        .from(this.tableName)
        .whereNotNull('activated_at')
        .select('id', 'activated_at')

      for (const row of rows) {
        const value = String(row.activated_at)
        if (!value.includes('T')) {
          continue
        }
        const normalized = DateTime.fromISO(value, { zone: 'utc' }).toFormat('yyyy-MM-dd HH:mm:ss')
        await db.from(this.tableName).where('id', row.id).update({ activated_at: normalized })
      }
    })
  }

  async down() {
    // No-op: normalized values remain valid for the previous code too.
  }
}
