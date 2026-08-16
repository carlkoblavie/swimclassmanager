import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'enrollment_lessons'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('enrollment_id')
        .unsigned()
        .notNullable()
        .references('enrollments.id')
        .onDelete('CASCADE')
      table
        .integer('class_lesson_id')
        .unsigned()
        .notNullable()
        .references('class_lessons.id')
        .onDelete('CASCADE')
      table.unique(['enrollment_id', 'class_lesson_id'], {
        indexName: 'enrollment_lessons_enrollment_lesson_unique',
      })
      table.index('class_lesson_id', 'enrollment_lessons_class_lesson_index')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
