import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'swimming_classes'

  // Classes no longer carry a fixed weekday/start time — a class is now just
  // skills + stage + duration. Scheduling (days/times) happens later, per lesson.
  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.setNullable('start_time')
      table.setNullable('weekday')
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.from(this.tableName).whereNull('start_time').update({ start_time: '09:00' })
      await db.from(this.tableName).whereNull('weekday').update({ weekday: 1 })
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.dropNullable('start_time')
      table.dropNullable('weekday')
    })
  }
}
