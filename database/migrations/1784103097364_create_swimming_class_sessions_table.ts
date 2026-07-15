import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'swimming_class_sessions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('swimming_class_id')
        .unsigned()
        .notNullable()
        .references('swimming_classes.id')
        .onDelete('CASCADE')
      table.timestamp('starts_at').notNullable()
      table.timestamp('ends_at').notNullable()
      table.timestamp('cancelled_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['swimming_class_id', 'starts_at'], {
        indexName: 'swimming_class_sessions_class_start_unique',
      })
      table.index('starts_at', 'swimming_class_sessions_starts_at_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
