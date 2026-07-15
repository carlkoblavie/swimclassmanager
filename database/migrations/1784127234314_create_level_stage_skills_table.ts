import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'level_stage_skills'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('level_stage_id')
        .unsigned()
        .notNullable()
        .references('level_stages.id')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      table.string('pass_criteria').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
