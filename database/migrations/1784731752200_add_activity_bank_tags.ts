import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('school_activity_age_groups', (table) => {
      table.increments('id')
      table
        .integer('school_activity_id')
        .unsigned()
        .notNullable()
        .references('school_activities.id')
        .onDelete('CASCADE')
      table
        .integer('school_age_group_id')
        .unsigned()
        .notNullable()
        .references('school_age_groups.id')
        .onDelete('CASCADE')

      table.unique(['school_activity_id', 'school_age_group_id'], {
        indexName: 'school_activity_age_groups_unique',
      })
    })

    this.schema.createTable('school_activity_skill_bank_skills', (table) => {
      table.increments('id')
      table
        .integer('school_activity_id')
        .unsigned()
        .notNullable()
        .references('school_activities.id')
        .onDelete('CASCADE')
      table
        .integer('skill_bank_skill_id')
        .unsigned()
        .notNullable()
        .references('skill_bank_skills.id')
        .onDelete('CASCADE')

      table.unique(['school_activity_id', 'skill_bank_skill_id'], {
        indexName: 'school_activity_skill_bank_skills_unique',
      })
    })
  }

  async down() {
    this.schema.dropTable('school_activity_skill_bank_skills')
    this.schema.dropTable('school_activity_age_groups')
  }
}
