import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'enrollments'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('swimming_class_id')
        .unsigned()
        .nullable()
        .references('swimming_classes.id')
        .onDelete('SET NULL')
      table.integer('term_id').unsigned().nullable().references('terms.id').onDelete('SET NULL')
      table.date('start_date').nullable()
      table.index(['swimming_class_id'], 'enrollments_swimming_class_index')
      table.index(['term_id'], 'enrollments_term_index')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['swimming_class_id'], 'enrollments_swimming_class_index')
      table.dropIndex(['term_id'], 'enrollments_term_index')
      table.dropColumn('swimming_class_id')
      table.dropColumn('term_id')
      table.dropColumn('start_date')
    })
  }
}
