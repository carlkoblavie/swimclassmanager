import { BaseSchema } from '@adonisjs/lucid/schema'
import { permissions, rolePermissions } from '#start/permissions'
import { RoleName } from '#values/role'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      for (const [name, keys] of Object.entries(rolePermissions)) {
        const existing = await db.from('roles').where('name', name).first()
        if (existing) {
          await db
            .from('roles')
            .where('name', name)
            .update({
              permissions: JSON.stringify(keys),
            })
        } else {
          await db.table('roles').insert({ name, permissions: JSON.stringify(keys) })
        }
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      const addedKeys = new Set<string>([
        permissions.getKey('enrolment.view'),
        permissions.getKey('enrolment.place'),
        permissions.getKey('lesson.edit'),
        permissions.getKey('lesson.activities.manage'),
        permissions.getKey('lesson.instructors.manage'),
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

      await db.from('roles').where('name', RoleName.ASSISTANT_COACH).delete()
    })
  }
}
