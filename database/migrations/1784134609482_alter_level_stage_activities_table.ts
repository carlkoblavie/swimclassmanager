import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'level_stage_activities'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('application_notes').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('application_notes')
    })
  }
}
