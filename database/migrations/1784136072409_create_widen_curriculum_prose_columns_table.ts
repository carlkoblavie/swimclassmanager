import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'level_stage_activities'

  async up() {
    // Descriptions and application notes hold long-form coaching prose;
    // varchar-sized string columns are the wrong type for them.
    this.schema.alterTable('level_stages', (table) => {
      table.text('description').nullable().alter()
    })
    this.schema.alterTable('level_stage_skills', (table) => {
      table.text('description').nullable().alter()
    })
    this.schema.alterTable(this.tableName, (table) => {
      table.text('description').nullable().alter()
      table.text('application_notes').nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable('level_stages', (table) => {
      table.string('description').nullable().alter()
    })
    this.schema.alterTable('level_stage_skills', (table) => {
      table.string('description').nullable().alter()
    })
    this.schema.alterTable(this.tableName, (table) => {
      table.string('description').nullable().alter()
      table.string('application_notes').nullable().alter()
    })
  }
}
