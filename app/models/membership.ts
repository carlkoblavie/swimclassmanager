import { compose } from '@adonisjs/core/helpers'
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { withRoles } from '@adonisplus/permissions'
import { MembershipSchema } from '#database/schema'
import School from '#models/school'
import User from '#models/user'
import Role from '#models/role'
import StageInstructor from '#models/stage_instructor'

export default class Membership extends compose(
  MembershipSchema,
  withRoles({
    roleModel: () => Role,
    pivotTable: 'membership_roles',
    pivotForeignKey: 'membership_id',
  })
) {
  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: unknown) => (typeof value === 'string' ? JSON.parse(value) : (value ?? null)),
  })
  declare certifications: string[] | null

  @belongsTo(() => School)
  declare school: BelongsTo<typeof School>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => StageInstructor)
  declare stageInstructors: HasMany<typeof StageInstructor>
}
