import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'signups'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('closed_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('closed_at')
    })
  }
}
