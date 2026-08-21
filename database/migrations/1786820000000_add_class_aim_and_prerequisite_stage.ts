import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'swimming_classes'

  async up() {
    // SQLite's alterTable rebuilds the parent table. With foreign keys enabled,
    // dropping that parent can cascade-delete class_lessons. Native ALTER TABLE
    // keeps the existing swimming_classes table (and its child lessons) intact.
    this.schema.raw(`ALTER TABLE ${this.tableName} ADD COLUMN aim TEXT`)
    this.schema.raw(
      `ALTER TABLE ${this.tableName} ADD COLUMN prerequisite_stage_id INTEGER REFERENCES level_stages(id) ON DELETE RESTRICT`
    )
    this.schema.raw(
      `CREATE INDEX swimming_classes_prerequisite_stage_index ON ${this.tableName} (prerequisite_stage_id)`
    )
  }

  async down() {
    this.schema.raw('DROP INDEX IF EXISTS swimming_classes_prerequisite_stage_index')
    this.schema.raw(`ALTER TABLE ${this.tableName} DROP COLUMN prerequisite_stage_id`)
    this.schema.raw(`ALTER TABLE ${this.tableName} DROP COLUMN aim`)
  }
}
