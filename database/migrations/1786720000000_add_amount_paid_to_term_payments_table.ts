import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'term_payments'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('amount_paid').notNullable().defaultTo(0)
    })

    this.defer(async (db) => {
      await db.rawQuery(`UPDATE ${this.tableName} SET amount_paid = amount WHERE status = ?`, [
        'success',
      ])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('amount_paid')
    })
  }
}
