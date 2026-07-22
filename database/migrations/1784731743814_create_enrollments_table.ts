import { BaseSchema } from '@adonisjs/lucid/schema'
import { EnrollmentStatus } from '#values/enrollment_status'

export default class extends BaseSchema {
  protected tableName = 'enrollments'

  async up() {
    // A learner's annual place in a level. One row holds one capacity slot
    // for the swim year; billing is per term via term_payments.
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.uuid('public_id').notNullable().unique()
      table
        .integer('school_id')
        .unsigned()
        .notNullable()
        .references('schools.id')
        .onDelete('CASCADE')
      table
        .integer('level_id')
        .unsigned()
        .notNullable()
        .references('levels.id')
        .onDelete('RESTRICT')
      table
        .integer('swim_year_id')
        .unsigned()
        .notNullable()
        .references('swim_years.id')
        .onDelete('RESTRICT')
      table
        .integer('learner_id')
        .unsigned()
        .notNullable()
        .references('learners.id')
        .onDelete('CASCADE')
      table.string('status').notNullable().defaultTo(EnrollmentStatus.PENDING)
      table.integer('price').notNullable() // per-term, pesewas, frozen at enroll
      table.string('currency').notNullable().defaultTo('GHS')
      table.timestamp('reserved_until').nullable() // pending slot expiry

      table.unique(['learner_id', 'level_id', 'swim_year_id'], {
        indexName: 'enrollments_learner_level_year_unique',
      })
      table.index(['level_id', 'swim_year_id'], 'enrollments_level_year_index')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
