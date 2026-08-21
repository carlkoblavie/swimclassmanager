import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'swimming_classes'

  async up() {
    // Keep this parent-table change native on SQLite so existing class_lessons
    // are not removed during a table rebuild.
    this.schema.raw(`ALTER TABLE ${this.tableName} ADD COLUMN assessment_goals TEXT`)
  }

  async down() {
    this.schema.raw(`ALTER TABLE ${this.tableName} DROP COLUMN assessment_goals`)
  }
}
