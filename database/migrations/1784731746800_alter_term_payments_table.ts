import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'term_payments'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('payment_transaction_id')
        .unsigned()
        .nullable()
        .references('payment_transactions.id')
        .onDelete('SET NULL')
      table.index('payment_transaction_id', 'term_payments_payment_transaction_id_index')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex('payment_transaction_id', 'term_payments_payment_transaction_id_index')
      table.dropColumn('payment_transaction_id')
    })
  }
}
