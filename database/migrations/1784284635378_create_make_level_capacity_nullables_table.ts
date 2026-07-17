import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'levels'

  async up() {
    // Capacity is no longer collected on the level form; existing values are
    // kept but new levels store none.
    this.schema.alterTable(this.tableName, (table) => {
      table.setNullable('capacity')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropNullable('capacity')
    })
  }
}
