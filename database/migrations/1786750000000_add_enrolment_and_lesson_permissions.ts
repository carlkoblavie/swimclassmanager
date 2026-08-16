import { BaseSchema } from '@adonisjs/lucid/schema'
import { permissions, rolePermissions } from '#start/permissions'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      for (const [name, keys] of Object.entries(rolePermissions)) {
        await db
          .from('roles')
          .where('name', name)
          .update({ permissions: JSON.stringify(keys) })
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      const addedKeys = new Set<string>([
        permissions.getKey('enrolment.withdraw'),
        permissions.getKey('lesson.generate'),
      ])

      for (const name of Object.keys(rolePermissions)) {
        const role = await db.from('roles').where('name', name).first()
        if (!role) {
          continue
        }

        const currentKeys = JSON.parse(String(role.permissions ?? '[]')) as string[]
        await db
          .from('roles')
          .where('name', name)
          .update({
            permissions: JSON.stringify(currentKeys.filter((key) => !addedKeys.has(key))),
          })
      }
    })
  }
}
