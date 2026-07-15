import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'level_stages'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // The single completion-requirement string is superseded by the skill
      // bank (level_stage_skills); stages keep an optional description.
      table.string('description').nullable()
    })

    this.defer(async (db) => {
      const rows = await db.from(this.tableName).select('id', 'completion_requirement')
      for (const row of rows) {
        await db
          .from(this.tableName)
          .where('id', row.id)
          .update({ description: row.completion_requirement })
      }
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('completion_requirement')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('completion_requirement').notNullable().defaultTo('')
    })

    this.defer(async (db) => {
      const rows = await db.from(this.tableName).whereNotNull('description').select('id', 'description')
      for (const row of rows) {
        await db
          .from(this.tableName)
          .where('id', row.id)
          .update({ completion_requirement: row.description })
      }
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('description')
    })
  }
}
