import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'learners'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('first_name').notNullable().defaultTo('')
      table.string('last_name').notNullable().defaultTo('')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('name')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('name').notNullable().defaultTo('')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('first_name')
      table.dropColumn('last_name')
    })
  }
}
