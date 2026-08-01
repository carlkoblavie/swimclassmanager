import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('school_activity_categories', (table) => {
      table.increments('id')
      table
        .integer('school_id')
        .unsigned()
        .notNullable()
        .references('schools.id')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      table.integer('purpose').notNullable()
      table.integer('position').notNullable()
      table.boolean('is_active').notNullable().defaultTo(true)

      table.unique(['school_id', 'name'], {
        indexName: 'school_activity_categories_school_name_unique',
      })

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })

    this.schema.createTable('school_activities', (table) => {
      table.increments('id')
      table
        .integer('school_id')
        .unsigned()
        .notNullable()
        .references('schools.id')
        .onDelete('CASCADE')
      table
        .integer('school_activity_category_id')
        .unsigned()
        .notNullable()
        .references('school_activity_categories.id')
        .onDelete('RESTRICT')
      table.string('name').notNullable()
      table.string('focus_area').nullable()
      table.text('description').nullable()
      table.string('equipment').nullable()
      table.text('safety_notes').nullable()
      table.string('success_cue').nullable()
      table.text('progression_easier').nullable()
      table.text('progression_harder').nullable()
      table.integer('duration_minutes').nullable()
      table.integer('position').notNullable()
      table.boolean('is_active').notNullable().defaultTo(true)

      table.unique(['school_id', 'name'], {
        indexName: 'school_activities_school_name_unique',
      })

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable('school_activities')
    this.schema.dropTable('school_activity_categories')
  }
}
