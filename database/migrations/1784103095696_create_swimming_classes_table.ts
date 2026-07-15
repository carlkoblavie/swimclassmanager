import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'swimming_classes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
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
      table.string('code').notNullable()
      table.string('name').notNullable()
      table.date('start_date').notNullable()
      table.date('end_date').notNullable()
      table.string('start_time').notNullable()
      table.string('end_time').notNullable()
      table.integer('capacity').notNullable()
      table.string('location').notNullable()
      table
        .integer('instructor_membership_id')
        .unsigned()
        .nullable()
        .references('memberships.id')
        .onDelete('SET NULL')
      table
        .integer('pending_instructor_invitation_id')
        .unsigned()
        .nullable()
        .references('invitations.id')
        .onDelete('SET NULL')
      table.timestamp('cancelled_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['school_id', 'code'], { indexName: 'swimming_classes_school_code_unique' })
      table.index(['school_id', 'level_id'], 'swimming_classes_school_level_index')
      table.index('instructor_membership_id', 'swimming_classes_instructor_membership_index')
      table.index(
        'pending_instructor_invitation_id',
        'swimming_classes_pending_instructor_invitation_index'
      )
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
