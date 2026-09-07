import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'swimming_classes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('max_lessons').unsigned().notNullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('max_lessons')
    })
  }
}
