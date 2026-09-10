import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'enrollment_stages'

  async up() {
    // A learner (via their enrollment) is assigned to one or more stages of a
    // level, progressively: one current stage, the rest upcoming, and completed
    // ones once they graduate. Order is by `position`.
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('enrollment_id')
        .unsigned()
        .notNullable()
        .references('enrollments.id')
        .onDelete('CASCADE')
      table
        .integer('level_stage_id')
        .unsigned()
        .notNullable()
        .references('level_stages.id')
        .onDelete('CASCADE')
      table.string('status').notNullable().defaultTo('upcoming')
      table.integer('position').notNullable().defaultTo(0)
      table.date('started_at').nullable()
      table.date('completed_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')

      table.unique(['enrollment_id', 'level_stage_id'], {
        indexName: 'enrollment_stages_enrollment_stage_unique',
      })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
