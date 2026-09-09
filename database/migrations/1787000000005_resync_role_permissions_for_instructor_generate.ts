import { BaseSchema } from '@adonisjs/lucid/schema'
import { rolePermissions } from '#start/permissions'

/**
 * Re-sync every role's stored permissions from the canonical map. Grants
 * instructors (Teacher, Assistant Coach) lesson.generate/lesson.edit now that
 * they own lesson planning within the stages they staff.
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      for (const [name, keys] of Object.entries(rolePermissions)) {
        await db.from('roles').where('name', name).update({ permissions: JSON.stringify(keys) })
      }
    })
  }

  async down() {
    // No-op: permissions are re-synced forward from the canonical map.
  }
}
