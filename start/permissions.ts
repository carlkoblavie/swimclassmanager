import { definePermissions } from '@adonisplus/permissions'
import { RoleName } from '#values/role'

export const permissions = definePermissions({
  invitation: {
    create: 'Invite members to the school',
  },
  signup: {
    view: 'View learn-to-swim sign-ups',
  },
  program: {
    manage: 'Manage swim programs and levels',
  },
  class: {
    view: 'View swimming classes and sessions',
    manage: 'Manage swimming classes and sessions',
  },
  school: {
    create: 'Create schools in an organisation',
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
    permissions.getKey('program.manage'),
    permissions.getKey('class.view'),
    permissions.getKey('class.manage'),
    permissions.getKey('school.create'),
  ],
  [RoleName.HEAD_COACH]: [
    permissions.getKey('invitation.create'),
    permissions.getKey('signup.view'),
    permissions.getKey('program.manage'),
    permissions.getKey('class.view'),
    permissions.getKey('class.manage'),
    permissions.getKey('school.create'),
  ],
  [RoleName.TEACHER]: [permissions.getKey('class.view')],
  [RoleName.DECK_SUPERVISOR]: [permissions.getKey('class.view')],
  [RoleName.PARENT]: [permissions.getKey('class.view')],
  [RoleName.STUDENT]: [permissions.getKey('class.view')],
}
