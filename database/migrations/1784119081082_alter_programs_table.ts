import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'programs'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Null = draft, set = active. One-way transition; no separate status column.
      table.timestamp('activated_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('activated_at')
    })
  }
}
