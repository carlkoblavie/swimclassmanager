import { BaseSchema } from '@adonisjs/lucid/schema'
import { RoleName } from '#values/role'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      for (const name of Object.values(RoleName)) {
        const existing = await db.from('roles').where('name', name).first()
        if (!existing) {
          await db.table('roles').insert({ name, permissions: '[]' })
        }
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.from('roles').whereIn('name', Object.values(RoleName)).delete()
    })
  }
}
