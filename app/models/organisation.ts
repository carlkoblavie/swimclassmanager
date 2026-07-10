import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { OrganisationSchema } from '#database/schema'
import User from '#models/user'
import School from '#models/school'

export default class Organisation extends OrganisationSchema {
  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare creator: BelongsTo<typeof User>

  @hasMany(() => School)
  declare schools: HasMany<typeof School>
}
