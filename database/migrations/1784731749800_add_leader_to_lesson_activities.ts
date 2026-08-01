import { BaseSchema } from '@adonisjs/lucid/schema'
import { LessonActivityLeader } from '#values/lesson_activity_leader'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('school_activities', (table) => {
      table.integer('led_by').notNullable().defaultTo(LessonActivityLeader.INSTRUCTOR)
    })

    this.schema.alterTable('lesson_activities', (table) => {
      table.integer('led_by').nullable()
    })
  }

  async down() {
    this.schema.alterTable('lesson_activities', (table) => {
      table.dropColumn('led_by')
    })

    this.schema.alterTable('school_activities', (table) => {
      table.dropColumn('led_by')
    })
  }
}
