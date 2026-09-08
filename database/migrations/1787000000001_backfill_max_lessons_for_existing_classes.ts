import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw('UPDATE swimming_classes SET max_lessons = 5 WHERE max_lessons IS NULL')
  }

  async down() {
    // No rollback needed - just restoring NULL would lose data
  }
}
