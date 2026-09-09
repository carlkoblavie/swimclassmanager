import type { HttpContext } from '@adonisjs/core/http'
import Invitation from '#models/invitation'
import Membership from '#models/membership'
import InvitationTransformer from '#transformers/invitation_transformer'
import MembershipTransformer from '#transformers/membership_transformer'

export default class MembersController {
  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const schoolId = user.activeSchoolId!

    const [members, invitations] = await Promise.all([
      Membership.query()
        .where('schoolId', schoolId)
        .preload('user')
        .preload('roles')
        // Instructors are now staffed per stage; count stages staffed.
        .withCount('stageInstructors', (query) => query.as('lessonsCount'))
        .orderBy('id'),
      Invitation.query()
        .where('schoolId', schoolId)
        .whereNull('acceptedAt')
        .preload('role')
        .orderBy('createdAt', 'desc'),
    ])

    return inertia.render('members/index', {
      members: MembershipTransformer.transform(members),
      invitations: InvitationTransformer.transform(invitations),
      currentUserId: user.id,
    })
  }
}
