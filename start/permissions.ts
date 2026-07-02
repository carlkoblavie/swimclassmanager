import { definePermissions } from '@adonisplus/permissions'
import { RoleName } from '#values/role'

export const permissions = definePermissions({
  invitation: {
    create: 'Invite members to the club',
  },
  signup: {
    view: 'View learn-to-swim sign-ups',
  },
})

export type PermissionKey = ReturnType<typeof permissions.keys>[number]

/**
 * Which permission keys each role holds. Consumed by the seed migration
 * (real environments) and the `seedRoles` test helper.
 */
export const rolePermissions: Record<string, PermissionKey[]> = {
  [RoleName.ADMINISTRATOR]: [
    permissions.getKey('invitation.create'),
    permissions.getKey('signup.view'),
  ],
  [RoleName.HEAD_COACH]: [
    permissions.getKey('invitation.create'),
    permissions.getKey('signup.view'),
  ],
}
