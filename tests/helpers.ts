import db from '@adonisjs/lucid/services/db'
import { RoleName } from '#values/role'
import { rolePermissions } from '#start/permissions'
import type Club from '#models/club'
import Role from '#models/role'
import Membership from '#models/membership'
import type User from '#models/user'

/**
 * Idempotently ensure the default role catalog exists with each role's
 * permissions. Re-run after each `truncate()` in groups whose tests found a
 * club, assert the catalog, or exercise permission-gated routes.
 */
export async function seedRoles() {
  for (const name of Object.values(RoleName)) {
    const permissions = JSON.stringify(rolePermissions[name] ?? [])
    const existing = await db.from('roles').where('name', name).first()
    if (existing) {
      await db.from('roles').where('name', name).update({ permissions })
    } else {
      await db.table('roles').insert({ name, permissions })
    }
  }
}

/**
 * Make a user a member of a club with the named role, and set it as their
 * active club. Requires the role catalog to be seeded.
 */
export async function joinClub(user: User, club: Club, roleName: string): Promise<Membership> {
  const membership = await Membership.create({ clubId: club.id, userId: user.id })
  const role = await Role.findByOrFail('name', roleName)
  await membership.related('roles').attach([role.id])

  user.activeClubId = club.id
  await user.save()

  return membership
}
