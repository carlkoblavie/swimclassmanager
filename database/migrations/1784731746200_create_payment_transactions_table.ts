import { BaseSchema } from '@adonisjs/lucid/schema'
import { PaymentStatus } from '#values/payment_status'

export default class extends BaseSchema {
  protected tableName = 'payment_transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.uuid('public_id').notNullable().unique()
      table
        .integer('purchase_id')
        .unsigned()
        .notNullable()
        .references('purchases.id')
        .onDelete('CASCADE')
      table.string('provider').notNullable()
      table.string('provider_reference').notNullable().unique()
      table.string('access_code').nullable()
      table.text('authorization_url').nullable()
      table.string('status').notNullable().defaultTo(PaymentStatus.PENDING)
      table.integer('amount').notNullable()
      table.string('currency').notNullable().defaultTo('GHS')
      table.text('provider_payload').nullable()
      table.timestamp('paid_at').nullable()
      table.timestamp('failed_at').nullable()

      table.index(['purchase_id', 'status'], 'payment_transactions_purchase_status_index')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
