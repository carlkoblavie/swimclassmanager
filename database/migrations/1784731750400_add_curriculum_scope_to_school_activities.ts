import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'school_activities'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('level_id').unsigned().nullable().references('levels.id').onDelete('SET NULL')
      table
        .integer('level_stage_id')
        .unsigned()
        .nullable()
        .references('level_stages.id')
        .onDelete('SET NULL')
      table
        .integer('level_stage_skill_id')
        .unsigned()
        .nullable()
        .references('level_stage_skills.id')
        .onDelete('SET NULL')
      table
        .integer('level_stage_activity_id')
        .unsigned()
        .nullable()
        .references('level_stage_activities.id')
        .onDelete('SET NULL')

      table.index('level_id', 'school_activities_level_id_index')
      table.index('level_stage_id', 'school_activities_level_stage_id_index')
      table.index('level_stage_skill_id', 'school_activities_level_stage_skill_id_index')
      table.index('level_stage_activity_id', 'school_activities_level_stage_activity_id_index')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex('level_stage_activity_id', 'school_activities_level_stage_activity_id_index')
      table.dropIndex('level_stage_skill_id', 'school_activities_level_stage_skill_id_index')
      table.dropIndex('level_stage_id', 'school_activities_level_stage_id_index')
      table.dropIndex('level_id', 'school_activities_level_id_index')
      table.dropColumn('level_stage_activity_id')
      table.dropColumn('level_stage_skill_id')
      table.dropColumn('level_stage_id')
      table.dropColumn('level_id')
    })
  }
}
