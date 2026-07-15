import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'swimming_classes'

  async up() {
    // Classes become day-based: one class per weekday with a duration, tied to
    // a level stage for its curriculum. Old term-based rows cannot be mapped
    // (multiple weekdays, no stage reference), so class data is wiped first.
    this.defer(async (db) => {
      await db.from('class_stage_skills').delete()
      await db.from('class_stages').delete()
      await db.from('swimming_class_sessions').delete()
      await db.from('swimming_class_weekdays').delete()
      await db.from(this.tableName).delete()
    })

    this.schema.dropTable('class_stage_skills')
    this.schema.dropTable('class_stages')
    this.schema.dropTable('swimming_class_sessions')
    this.schema.dropTable('swimming_class_weekdays')
    this.schema.dropTable('skills')

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('start_date')
      table.dropColumn('end_date')
      table.dropColumn('end_time')
      table.dropColumn('capacity')
      table.setNullable('location')
      table.integer('weekday').notNullable().defaultTo(1)
      table.integer('duration_minutes').notNullable().defaultTo(45)
      table
        .integer('level_stage_id')
        .unsigned()
        .notNullable()
        .defaultTo(0)
        .references('level_stages.id')
        .onDelete('RESTRICT')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('weekday')
      table.dropColumn('duration_minutes')
      table.dropColumn('level_stage_id')
      table.dropNullable('location')
      table.date('start_date').notNullable().defaultTo('2026-01-01')
      table.date('end_date').notNullable().defaultTo('2026-01-01')
      table.string('end_time').notNullable().defaultTo('00:00')
      table.integer('capacity').notNullable().defaultTo(0)
    })

    this.schema.createTable('skills', (table) => {
      table.increments('id')
      table.integer('school_id').unsigned().nullable().references('schools.id').onDelete('CASCADE')
      table.string('name').notNullable()
      table.text('description').nullable()
      table.boolean('is_default').notNullable().defaultTo(false)
      table
        .integer('created_by_user_id')
        .unsigned()
        .nullable()
        .references('users.id')
        .onDelete('SET NULL')
      table.index(['school_id', 'name'], 'skills_school_name_index')
      table.index(['is_default', 'name'], 'skills_default_name_index')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })

    this.schema.createTable('swimming_class_weekdays', (table) => {
      table.increments('id')
      table
        .integer('swimming_class_id')
        .unsigned()
        .notNullable()
        .references('swimming_classes.id')
        .onDelete('CASCADE')
      table.integer('weekday').notNullable()
      table.unique(['swimming_class_id', 'weekday'], {
        indexName: 'swimming_class_weekdays_class_weekday_unique',
      })
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })

    this.schema.createTable('swimming_class_sessions', (table) => {
      table.increments('id')
      table
        .integer('swimming_class_id')
        .unsigned()
        .notNullable()
        .references('swimming_classes.id')
        .onDelete('CASCADE')
      table.timestamp('starts_at').notNullable()
      table.timestamp('ends_at').notNullable()
      table.timestamp('cancelled_at').nullable()
      table.unique(['swimming_class_id', 'starts_at'], {
        indexName: 'swimming_class_sessions_class_start_unique',
      })
      table.index(['starts_at'], 'swimming_class_sessions_starts_at_index')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })

    this.schema.createTable('class_stages', (table) => {
      table.increments('id')
      table
        .integer('swimming_class_id')
        .unsigned()
        .notNullable()
        .references('swimming_classes.id')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      table.integer('position').notNullable()
      table.unique(['swimming_class_id', 'position'], {
        indexName: 'class_stages_class_position_unique',
      })
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })

    this.schema.createTable('class_stage_skills', (table) => {
      table.increments('id')
      table
        .integer('class_stage_id')
        .unsigned()
        .notNullable()
        .references('class_stages.id')
        .onDelete('CASCADE')
      table.integer('skill_id').unsigned().notNullable().references('skills.id')
      table.unique(['class_stage_id', 'skill_id'], {
        indexName: 'class_stage_skills_stage_skill_unique',
      })
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })
  }
}
