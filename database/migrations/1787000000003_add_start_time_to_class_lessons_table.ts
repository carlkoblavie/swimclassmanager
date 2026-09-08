import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'class_lessons'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('start_time').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('start_time')
    })
  }
}
