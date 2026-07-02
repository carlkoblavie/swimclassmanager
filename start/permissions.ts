import { definePermissions } from '@adonisplus/permissions'

export const permissions = definePermissions({
  // Define your permissions here
  // resource: {
  //   action: 'Description of this permission',
  // },
})

export type PermissionKey = ReturnType<typeof permissions.keys>[number]
