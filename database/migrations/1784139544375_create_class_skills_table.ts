import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'class_skills'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('swimming_class_id')
        .unsigned()
        .notNullable()
        .references('swimming_classes.id')
        .onDelete('CASCADE')
      table
        .integer('level_stage_skill_id')
        .unsigned()
        .notNullable()
        .references('level_stage_skills.id')
        .onDelete('RESTRICT')

      table.unique(['swimming_class_id', 'level_stage_skill_id'], {
        indexName: 'class_skills_class_skill_unique',
      })

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
