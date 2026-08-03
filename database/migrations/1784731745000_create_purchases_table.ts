import { BaseSchema } from '@adonisjs/lucid/schema'
import { PurchaseStatus } from '#values/purchase_status'

export default class extends BaseSchema {
  protected tableName = 'purchases'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.uuid('public_id').notNullable().unique()
      table
        .integer('school_id')
        .unsigned()
        .notNullable()
        .references('schools.id')
        .onDelete('CASCADE')
      table
        .integer('signup_id')
        .unsigned()
        .notNullable()
        .references('signups.id')
        .onDelete('CASCADE')
      table
        .integer('swim_year_id')
        .unsigned()
        .notNullable()
        .references('swim_years.id')
        .onDelete('RESTRICT')
      table.string('status').notNullable().defaultTo(PurchaseStatus.PENDING)
      table.integer('total_amount').notNullable()
      table.string('currency').notNullable().defaultTo('GHS')
      table.timestamp('paid_at').nullable()
      table.timestamp('failed_at').nullable()

      table.index(['school_id', 'status'], 'purchases_school_status_index')
      table.index('signup_id', 'purchases_signup_id_index')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
