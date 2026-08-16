import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'swimming_classes'

  // Classes no longer carry a fixed weekday/start time — a class is now just
  // skills + stage + duration. Scheduling (days/times) happens later, per lesson.
  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('start_time').nullable().alter()
      table.integer('weekday').nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('start_time').notNullable().alter()
      table.integer('weekday').notNullable().defaultTo(1).alter()
    })
  }
}
