import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('skill_bank_skills', (table) => {
      table.string('source_version').nullable()
      table.unique(['school_id', 'source_key'], {
        indexName: 'skill_bank_skills_school_source_key_unique',
      })
    })

    this.schema.alterTable('school_activities', (table) => {
      table.string('source_type').notNullable().defaultTo('school')
      table.string('source_key').nullable()
      table.string('source_version').nullable()

      table.unique(['school_id', 'source_key'], {
        indexName: 'school_activities_school_source_key_unique',
      })
      table.index(['school_id', 'source_type'], 'school_activities_school_source_type_index')
    })
  }

  async down() {
    this.schema.alterTable('school_activities', (table) => {
      table.dropIndex(['school_id', 'source_type'], 'school_activities_school_source_type_index')
      table.dropUnique(['school_id', 'source_key'], 'school_activities_school_source_key_unique')
      table.dropColumn('source_version')
      table.dropColumn('source_key')
      table.dropColumn('source_type')
    })

    this.schema.alterTable('skill_bank_skills', (table) => {
      table.dropUnique(['school_id', 'source_key'], 'skill_bank_skills_school_source_key_unique')
      table.dropColumn('source_version')
    })
  }
}
