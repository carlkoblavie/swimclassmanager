import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'lesson_attendances'

  async up() {
    // One attendance mark per learner per lesson: present, late, or absent.
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('class_lesson_id')
        .unsigned()
        .notNullable()
        .references('class_lessons.id')
        .onDelete('CASCADE')
      table.integer('learner_id').unsigned().notNullable().references('learners.id').onDelete('CASCADE')
      table.string('status').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')

      table.unique(['class_lesson_id', 'learner_id'], {
        indexName: 'lesson_attendances_lesson_learner_unique',
      })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
