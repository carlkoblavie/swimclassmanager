import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'swimming_classes'

  async up() {
    // Nullable: classes created before swim years exist stay untied until
    // edited. RESTRICT keeps a term (and its swim year) undeletable while
    // classes reference it.
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('term_id').unsigned().nullable().references('terms.id').onDelete('RESTRICT')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('term_id')
    })
  }
}
