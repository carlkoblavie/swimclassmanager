import { BaseSchema } from '@adonisjs/lucid/schema'
import { permissions, rolePermissions } from '#start/permissions'
import { RoleName } from '#values/role'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db
        .from('roles')
        .where('name', RoleName.ADMINISTRATOR)
        .update({
          permissions: JSON.stringify(rolePermissions[RoleName.ADMINISTRATOR] ?? []),
        })
    })
  }

  async down() {
    this.defer(async (db) => {
      await db
        .from('roles')
        .where('name', RoleName.ADMINISTRATOR)
        .update({
          permissions: JSON.stringify([
            ...(rolePermissions[RoleName.ADMINISTRATOR] ?? []),
            permissions.getKey('enrolment.withdraw'),
            permissions.getKey('lesson.generate'),
          ]),
        })
    })
  }
}
