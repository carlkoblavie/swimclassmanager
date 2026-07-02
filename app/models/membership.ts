import { compose } from '@adonisjs/core/helpers'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { withRoles } from '@adonisplus/permissions'
import { MembershipSchema } from '#database/schema'
import Club from '#models/club'
import User from '#models/user'
import Role from '#models/role'

export default class Membership extends compose(
  MembershipSchema,
  withRoles({
    roleModel: () => Role,
    pivotTable: 'membership_roles',
    pivotForeignKey: 'membership_id',
  })
) {
  @belongsTo(() => Club)
  declare club: BelongsTo<typeof Club>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
