import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'purchase_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('purchase_id')
        .unsigned()
        .notNullable()
        .references('purchases.id')
        .onDelete('CASCADE')
      table
        .integer('enrollment_id')
        .unsigned()
        .notNullable()
        .references('enrollments.id')
        .onDelete('CASCADE')
      table
        .integer('learner_id')
        .unsigned()
        .notNullable()
        .references('learners.id')
        .onDelete('CASCADE')
      table
        .integer('level_id')
        .unsigned()
        .notNullable()
        .references('levels.id')
        .onDelete('RESTRICT')
      table.string('level_public_id').notNullable()
      table.string('level_name').notNullable()
      table.integer('amount').notNullable()
      table.string('currency').notNullable().defaultTo('GHS')

      table.unique('enrollment_id', {
        indexName: 'purchase_items_enrollment_id_unique',
      })
      table.index('purchase_id', 'purchase_items_purchase_id_index')
      table.index(['learner_id', 'level_id'], 'purchase_items_learner_level_index')
      table.index('level_public_id', 'purchase_items_level_public_id_index')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
