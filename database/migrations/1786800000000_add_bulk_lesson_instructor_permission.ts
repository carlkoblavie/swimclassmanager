import { BaseSchema } from '@adonisjs/lucid/schema'
import { permissions, rolePermissions } from '#start/permissions'
import { RoleName } from '#values/role'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      for (const roleName of [RoleName.ADMINISTRATOR, RoleName.HEAD_COACH]) {
        await db
          .from('roles')
          .where('name', roleName)
          .update({
            permissions: JSON.stringify(rolePermissions[roleName] ?? []),
          })
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      const bulkPermission = permissions.getKey('lesson.instructors.bulk_manage')

      for (const roleName of [RoleName.ADMINISTRATOR, RoleName.HEAD_COACH]) {
        const role = await db.from('roles').where('name', roleName).first()
        if (!role) {
          continue
        }

        const currentPermissions = JSON.parse(String(role.permissions ?? '[]')) as string[]
        await db
          .from('roles')
          .where('name', roleName)
          .update({
            permissions: JSON.stringify(
              currentPermissions.filter((permission) => permission !== bulkPermission)
            ),
          })
      }
    })
  }
}
