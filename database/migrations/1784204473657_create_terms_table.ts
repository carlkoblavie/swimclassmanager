import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'terms'

  async up() {
    // A named, dated slice of a swim year (e.g. "Term 1 — Autumn"). Positions
    // are system-assigned from start-date order.
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('swim_year_id')
        .unsigned()
        .notNullable()
        .references('swim_years.id')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      table.integer('position').unsigned().notNullable()
      table.date('starts_on').notNullable()
      table.date('ends_on').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
