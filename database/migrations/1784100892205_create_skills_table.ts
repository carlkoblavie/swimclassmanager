import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'skills'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('school_id').unsigned().nullable().references('schools.id').onDelete('CASCADE')
      table.string('name').notNullable()
      table.text('description').nullable()
      table.boolean('is_default').notNullable().defaultTo(false)
      table
        .integer('created_by_user_id')
        .unsigned()
        .nullable()
        .references('users.id')
        .onDelete('SET NULL')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['school_id', 'name'], 'skills_school_name_index')
      table.index(['is_default', 'name'], 'skills_default_name_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
