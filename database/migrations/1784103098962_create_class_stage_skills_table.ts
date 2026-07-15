import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'class_stage_skills'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('class_stage_id')
        .unsigned()
        .notNullable()
        .references('class_stages.id')
        .onDelete('CASCADE')
      table
        .integer('skill_id')
        .unsigned()
        .notNullable()
        .references('skills.id')
        .onDelete('RESTRICT')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['class_stage_id', 'skill_id'], {
        indexName: 'class_stage_skills_stage_skill_unique',
      })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
