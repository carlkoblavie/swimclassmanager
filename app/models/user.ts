import { DateTime } from 'luxon'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { UserSchema } from '#database/schema'
import School from '#models/school'
import Membership from '#models/membership'
import Organisation from '#models/organisation'

export default class User extends UserSchema {
  @hasMany(() => Membership)
  declare memberships: HasMany<typeof Membership>

  @hasMany(() => Organisation, { foreignKey: 'createdByUserId' })
  declare createdOrganisations: HasMany<typeof Organisation>

  @hasMany(() => School, { foreignKey: 'createdByUserId' })
  declare createdSchools: HasMany<typeof School>

  @belongsTo(() => Organisation, { foreignKey: 'activeOrganisationId' })
  declare activeOrganisation: BelongsTo<typeof Organisation>

  @belongsTo(() => School, { foreignKey: 'activeSchoolId' })
  declare activeSchool: BelongsTo<typeof School>

  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }

  get isProfileComplete(): boolean {
    return Boolean(this.profileCompletedAt)
  }

  async completeProfile(data: {
    fullName: string
    phone: string
    country?: string | null
  }): Promise<void> {
    this.fullName = data.fullName
    this.phone = data.phone
    this.country = data.country ?? null
    this.profileCompletedAt = DateTime.now()
    await this.save()
  }
}
