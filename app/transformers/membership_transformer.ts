import { BaseTransformer } from '@adonisjs/core/transformers'
import type Membership from '#models/membership'
import type Role from '#models/role'
import type User from '#models/user'

export default class MembershipTransformer extends BaseTransformer<Membership> {
  toObject() {
    const preloaded = this.resource.$preloaded as { user?: User; roles?: Role[] }
    const user = preloaded.user ?? this.resource.user
    const roles = (preloaded.roles ?? this.resource.roles ?? []).map((role) => role.name)
    const label = user?.fullName?.trim() || user?.email || `Member #${this.resource.id}`

    return {
      ...this.pick(this.resource, ['id', 'schoolId', 'userId']),
      user: user
        ? {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
          }
        : undefined,
      roles,
      label,
      lessonsCount: Number(this.resource.$extras.lessonsCount ?? 0),
    }
  }
}
