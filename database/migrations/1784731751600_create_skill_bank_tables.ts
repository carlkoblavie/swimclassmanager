import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('skill_bank_skills', (table) => {
      table.increments('id')
      table.integer('school_id').unsigned().nullable().references('schools.id').onDelete('CASCADE')
      table.string('source_type').notNullable().defaultTo('school')
      table.string('source_key').nullable()
      table.string('family').notNullable()
      table.string('name').notNullable()
      table.text('description').nullable()
      table.string('pass_criteria').nullable()
      table.integer('position').notNullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table
        .integer('created_by_user_id')
        .unsigned()
        .nullable()
        .references('users.id')
        .onDelete('SET NULL')

      table.unique(['school_id', 'name'], {
        indexName: 'skill_bank_skills_school_name_unique',
      })
      table.index(['school_id', 'family'], 'skill_bank_skills_school_family_index')
      table.index(['source_type', 'family'], 'skill_bank_skills_source_family_index')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable('skill_bank_skills')
  }
}
