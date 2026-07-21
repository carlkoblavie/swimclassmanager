import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'levels'

  async up() {
    // Curriculum length: how many class sessions complete the level. Stages
    // inherit it, and classes may not plan more lessons than it. Nullable for
    // levels created before the concept existed (no cap until set).
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('classes_count').unsigned().nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('classes_count')
    })
  }
}
