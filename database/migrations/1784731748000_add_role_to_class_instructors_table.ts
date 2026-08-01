import { BaseSchema } from '@adonisjs/lucid/schema'
import { ClassInstructorRole } from '#values/class_instructor_role'

export default class extends BaseSchema {
  protected tableName = 'class_instructors'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('role').notNullable().defaultTo(ClassInstructorRole.SUPPORTING)
    })

    this.defer(async (db) => {
      const rows = await db
        .from(this.tableName)
        .orderBy('swimming_class_id')
        .orderBy('id')
        .select('id', 'swimming_class_id')

      const seenClasses = new Set<number>()
      for (const row of rows) {
        if (seenClasses.has(row.swimming_class_id)) {
          continue
        }

        seenClasses.add(row.swimming_class_id)
        await db.from(this.tableName).where('id', row.id).update({ role: ClassInstructorRole.LEAD })
      }
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('role')
    })
  }
}
