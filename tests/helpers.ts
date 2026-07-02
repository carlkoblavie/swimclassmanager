import db from '@adonisjs/lucid/services/db'
import { RoleName } from '#values/role'

/**
 * Idempotently ensure the default role catalog exists. Re-run after each
 * `truncate()` in groups whose tests found a club or assert the catalog.
 */
export async function seedRoles() {
  for (const name of Object.values(RoleName)) {
    const existing = await db.from('roles').where('name', name).first()
    if (!existing) {
      await db.table('roles').insert({ name, permissions: '[]' })
    }
  }
}
