import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'level_stages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('level_id')
        .unsigned()
        .notNullable()
        .references('levels.id')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      table.integer('position').notNullable()
      table.string('completion_requirement').notNullable()

      table.unique(['level_id', 'position'], {
        indexName: 'level_stages_level_position_unique',
      })

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
