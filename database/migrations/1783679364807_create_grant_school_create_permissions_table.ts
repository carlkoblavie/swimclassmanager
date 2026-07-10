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
      const schoolCreate = permissions.getKey('school.create')

      for (const [name, keys] of Object.entries(rolePermissions)) {
        await db
          .from('roles')
          .where('name', name)
          .update({ permissions: JSON.stringify(keys.filter((key) => key !== schoolCreate)) })
      }
    })
  }
}
