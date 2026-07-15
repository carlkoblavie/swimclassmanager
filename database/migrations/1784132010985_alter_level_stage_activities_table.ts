import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'level_stage_activities'

  async up() {
    // Activities now belong to a skill, not directly to a stage. Existing rows
    // cannot be attributed to a skill, so the table is recreated empty.
    this.schema.dropTable(this.tableName)

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('level_stage_skill_id')
        .unsigned()
        .notNullable()
        .references('level_stage_skills.id')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      table.integer('duration_minutes').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('level_stage_id')
        .unsigned()
        .notNullable()
        .references('level_stages.id')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      table.integer('duration_minutes').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })
  }
}
