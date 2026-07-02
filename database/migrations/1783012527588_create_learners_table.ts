import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'learners'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('signup_id')
        .unsigned()
        .notNullable()
        .references('signups.id')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      table.date('date_of_birth').notNullable()
      table.string('gender').notNullable()
      table.string('nationality').notNullable()
      table.string('residential_location').notNullable()
      table.text('medical_info').notNullable()
      table.text('swimming_experience').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index('signup_id', 'learners_signup_id_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
