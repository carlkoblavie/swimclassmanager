import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'clubs'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('organisation_id')
        .unsigned()
        .nullable()
        .references('organisations.id')
        .onDelete('CASCADE')
      table.index('organisation_id', 'clubs_organisation_id_index')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['organisation_id'], 'clubs_organisation_id_index')
      table.dropColumn('organisation_id')
    })
  }
}
