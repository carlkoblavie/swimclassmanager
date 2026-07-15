import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'programs'

  async up() {
    // Programs that existed before the draft flow were already live; keep them visible.
    this.defer(async (db) => {
      await db
        .from(this.tableName)
        .whereNull('activated_at')
        .update({ activated_at: new Date().toISOString() })
    })
  }

  async down() {
    // No data restoration possible: pre-existing and since-activated programs are indistinguishable.
  }
}
