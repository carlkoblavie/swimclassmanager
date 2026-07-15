import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'level_stage_activities'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('duration_minutes')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('duration_minutes').notNullable().defaultTo(0)
    })
  }
}
