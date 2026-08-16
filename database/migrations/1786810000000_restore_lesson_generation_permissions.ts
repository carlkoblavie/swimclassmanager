import { BaseSchema } from '@adonisjs/lucid/schema'
import { permissions } from '#start/permissions'
import { RoleName } from '#values/role'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      const lessonGeneration = permissions.getKey('lesson.generate')

      for (const roleName of [RoleName.ADMINISTRATOR, RoleName.HEAD_COACH]) {
        const role = await db.from('roles').where('name', roleName).first()
        if (!role) {
          continue
        }

        const currentPermissions = JSON.parse(String(role.permissions ?? '[]')) as string[]
        if (currentPermissions.includes(lessonGeneration)) {
          continue
        }

        await db
          .from('roles')
          .where('name', roleName)
          .update({
            permissions: JSON.stringify([...currentPermissions, lessonGeneration]),
          })
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      const lessonGeneration = permissions.getKey('lesson.generate')

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
              currentPermissions.filter((permission) => permission !== lessonGeneration)
            ),
          })
      }
    })
  }
}
