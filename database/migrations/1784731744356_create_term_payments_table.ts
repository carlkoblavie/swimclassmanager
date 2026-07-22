import { BaseSchema } from '@adonisjs/lucid/schema'
import { PaymentStatus } from '#values/payment_status'

export default class extends BaseSchema {
  protected tableName = 'term_payments'

  async up() {
    // One payment per term of the enrollment's swim year.
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.uuid('public_id').notNullable().unique()
      table
        .integer('enrollment_id')
        .unsigned()
        .notNullable()
        .references('enrollments.id')
        .onDelete('CASCADE')
      table
        .integer('term_id')
        .unsigned()
        .notNullable()
        .references('terms.id')
        .onDelete('RESTRICT')
      table.integer('amount').notNullable() // pesewas
      table.string('currency').notNullable().defaultTo('GHS')
      table.string('status').notNullable().defaultTo(PaymentStatus.PENDING)
      table.string('provider').nullable()
      table.string('provider_reference').nullable().unique()
      table.timestamp('paid_at').nullable()

      table.unique(['enrollment_id', 'term_id'], {
        indexName: 'term_payments_enrollment_term_unique',
      })

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
