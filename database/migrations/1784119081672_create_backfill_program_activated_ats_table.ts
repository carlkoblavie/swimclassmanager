import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'programs'

  async up() {
    // Programs that existed before the draft flow were already live; keep them
    // visible. SQL timestamp format, matching what Lucid reads back.
    this.defer(async (db) => {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
      await db.from(this.tableName).whereNull('activated_at').update({ activated_at: now })
    })
  }

  async down() {
    // No data restoration possible: pre-existing and since-activated programs are indistinguishable.
  }
}
