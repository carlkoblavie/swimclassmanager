import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'swim_years'

  async up() {
    // A school's academic swim calendar: named automatically after the years
    // it spans (e.g. 2025/2026) and holding one or more dated terms.
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('school_id')
        .unsigned()
        .notNullable()
        .references('schools.id')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      table.date('starts_on').notNullable()
      table.date('ends_on').notNullable()

      table.unique(['school_id', 'name'], { indexName: 'swim_years_school_name_unique' })

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
