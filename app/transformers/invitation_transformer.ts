import { BaseTransformer } from '@adonisjs/core/transformers'
import type Invitation from '#models/invitation'

export default class InvitationTransformer extends BaseTransformer<Invitation> {
  toObject() {
    const fullName = this.resource.inviteeFullName

    return {
      ...this.pick(this.resource, [
        'id',
        'schoolId',
        'email',
        'inviteeFirstName',
        'inviteeLastName',
      ]),
      fullName,
      label: fullName || this.resource.email,
      certifications: this.resource.certifications ?? [],
      isPending: this.resource.isPending,
      isExpired: this.resource.isExpired,
    }
  }
}
