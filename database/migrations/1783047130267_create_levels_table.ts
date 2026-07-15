import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'levels'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('program_id')
        .unsigned()
        .notNullable()
        .references('programs.id')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      table.string('age_group').notNullable()
      table.text('description').notNullable()
      table.integer('default_fee').notNullable()
      table.integer('capacity').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index('program_id', 'levels_program_id_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
