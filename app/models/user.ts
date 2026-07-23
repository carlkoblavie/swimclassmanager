import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { errors } from '@adonisjs/auth'
import { beforeSave, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { UserSchema } from '#database/schema'
import School from '#models/school'
import Membership from '#models/membership'
import Organisation from '#models/organisation'

export default class User extends UserSchema {
  @column({ serializeAs: null })
  declare password: string | null

  @column()
  declare mustChangePassword: boolean

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

  static async verifyCredentials(email: string, password: string): Promise<User> {
    if (!email || !password) {
      throw new errors.E_INVALID_CREDENTIALS('Invalid user credentials')
    }

    const user = await User.findBy('email', email)
    if (!user || !user.password) {
      await hash.use().make(password)
      throw new errors.E_INVALID_CREDENTIALS('Invalid user credentials')
    }

    if (await hash.use().verify(user.password, password)) {
      return user
    }

    throw new errors.E_INVALID_CREDENTIALS('Invalid user credentials')
  }

  @beforeSave()
  static async hashNullablePassword(user: User) {
    if (user.$dirty.password && user.password) {
      user.password = await hash.use().make(user.password)
    }
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

  async changePassword(password: string): Promise<void> {
    this.password = password
    this.mustChangePassword = false
    await this.save()
  }
}
