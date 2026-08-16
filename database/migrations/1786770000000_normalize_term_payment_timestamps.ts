import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'term_payments'

  async up() {
    await this.db.rawQuery(`
      UPDATE ${this.tableName}
      SET created_at = datetime(created_at)
      WHERE created_at LIKE '%T%'
    `)

    await this.db.rawQuery(`
      UPDATE ${this.tableName}
      SET paid_at = datetime(paid_at)
      WHERE paid_at LIKE '%T%'
    `)
  }

  async down() {}
}
