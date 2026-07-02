import { compose } from '@adonisjs/core/helpers'
import { withPermissions } from '@adonisplus/permissions'
import { RoleSchema } from '#database/schema'

export default class Role extends compose(RoleSchema, withPermissions()) {}
