import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'membership_roles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('membership_id')
        .unsigned()
        .notNullable()
        .references('memberships.id')
        .onDelete('CASCADE')
      table.integer('role_id').unsigned().notNullable().references('roles.id').onDelete('CASCADE')
      table.unique(['membership_id', 'role_id'], { indexName: 'membership_roles_unique' })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
