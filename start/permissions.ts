import { definePermissions } from '@adonisplus/permissions'
import { RoleName } from '#values/role'

export const permissions = definePermissions({
  invitation: {
    create: 'Invite members to the club',
  },
})

export type PermissionKey = ReturnType<typeof permissions.keys>[number]

/**
 * Which permission keys each role holds. Consumed by the seed migration
 * (real environments) and the `seedRoles` test helper.
 */
export const rolePermissions: Record<string, PermissionKey[]> = {
  [RoleName.ADMINISTRATOR]: [permissions.getKey('invitation.create')],
  [RoleName.HEAD_COACH]: [permissions.getKey('invitation.create')],
}
