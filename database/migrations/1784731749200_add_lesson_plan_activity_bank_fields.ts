import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('class_lessons', (table) => {
      table.text('objectives').nullable()
      table.text('observation').nullable()
      table.timestamp('concluded_at').nullable()
    })

    this.schema.alterTable('lesson_activities', (table) => {
      table.setNullable('level_stage_activity_id')
      table
        .integer('school_activity_id')
        .unsigned()
        .nullable()
        .references('school_activities.id')
        .onDelete('SET NULL')
      table.integer('position').notNullable().defaultTo(1)
      table.string('category_name').nullable()
      table.string('activity_name').nullable()
      table.text('activity_description').nullable()
      table.integer('duration_minutes').nullable()
      table.string('success_cue').nullable()
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.from('lesson_activities').whereNull('level_stage_activity_id').delete()
    })

    this.schema.alterTable('lesson_activities', (table) => {
      table.dropColumn('success_cue')
      table.dropColumn('duration_minutes')
      table.dropColumn('activity_description')
      table.dropColumn('activity_name')
      table.dropColumn('category_name')
      table.dropColumn('position')
      table.dropColumn('school_activity_id')
      table.dropNullable('level_stage_activity_id')
    })

    this.schema.alterTable('class_lessons', (table) => {
      table.dropColumn('concluded_at')
      table.dropColumn('observation')
      table.dropColumn('objectives')
    })
  }
}
