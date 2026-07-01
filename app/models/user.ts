import { DateTime } from 'luxon'
import { UserSchema } from '#database/schema'

export default class User extends UserSchema {
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
