import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        UPDATE enrollments
        SET term_id = (
          SELECT terms.id
          FROM terms
          WHERE terms.swim_year_id = enrollments.swim_year_id
          ORDER BY terms.position
          LIMIT 1
        )
        WHERE enrollments.term_id IS NULL
      `)
    })
  }

  async down() {}
}
