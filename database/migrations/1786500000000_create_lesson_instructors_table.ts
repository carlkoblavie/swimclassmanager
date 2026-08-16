import { BaseSchema } from '@adonisjs/lucid/schema'
import { ClassInstructorRole } from '#values/class_instructor_role'

export default class extends BaseSchema {
  protected tableName = 'lesson_instructors'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('class_lesson_id')
        .unsigned()
        .notNullable()
        .references('class_lessons.id')
        .onDelete('CASCADE')
      table
        .integer('membership_id')
        .unsigned()
        .nullable()
        .references('memberships.id')
        .onDelete('CASCADE')
      table
        .integer('invitation_id')
        .unsigned()
        .nullable()
        .references('invitations.id')
        .onDelete('CASCADE')
      table.integer('role').notNullable().defaultTo(ClassInstructorRole.SUPPORTING)
      table.unique(['class_lesson_id', 'membership_id'], { indexName: 'lesson_instructors_lesson_membership_unique' })
      table.unique(['class_lesson_id', 'invitation_id'], { indexName: 'lesson_instructors_lesson_invitation_unique' })
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })

    this.defer(async (db) => {
      const lessons = await db.from('class_lessons').select('id', 'swimming_class_id')
      const instructors = await db
        .from('class_instructors')
        .select('swimming_class_id', 'membership_id', 'invitation_id', 'role')
      const byClass = new Map<number, typeof instructors>()
      for (const instructor of instructors) {
        byClass.set(instructor.swimming_class_id, [
          ...(byClass.get(instructor.swimming_class_id) ?? []),
          instructor,
        ])
      }
      const now = new Date().toISOString()
      for (const lesson of lessons) {
        const assignments = byClass.get(lesson.swimming_class_id) ?? []
        if (assignments.length > 0) {
          await db.table(this.tableName).insert(
            assignments.map((assignment) => ({
              class_lesson_id: lesson.id,
              membership_id: assignment.membership_id,
              invitation_id: assignment.invitation_id,
              role: assignment.role,
              created_at: now,
            }))
          )
        }
      }
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
