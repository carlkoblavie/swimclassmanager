import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'class_stages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('swimming_class_id')
        .unsigned()
        .notNullable()
        .references('swimming_classes.id')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      table.integer('position').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['swimming_class_id', 'position'], {
        indexName: 'class_stages_class_position_unique',
      })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
