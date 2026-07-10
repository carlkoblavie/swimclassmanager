import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'organisations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('slug').notNullable().unique()
      table.boolean('is_premium').notNullable().defaultTo(false)
      table
        .integer('created_by_user_id')
        .unsigned()
        .notNullable()
        .references('users.id')
        .onDelete('CASCADE')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index('created_by_user_id', 'organisations_created_by_user_id_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
