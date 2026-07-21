import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Membership from '#models/membership'
import School from '#models/school'
import type Invitation from '#models/invitation'

export default class InvitationAcceptanceService {
  /**
   * Accept an invitation: find-or-create the user by email, join them to the
   * school with the invited role, set it active, and stamp the invitation. All
   * in one transaction; idempotent for an already-accepted invitation.
   */
  async accept(invitation: Invitation): Promise<User> {
    return db.transaction(async (trx) => {
      const user = await User.firstOrCreate({ email: invitation.email }, {}, { client: trx })

      const membership = await Membership.firstOrCreate(
        { schoolId: invitation.schoolId, userId: user.id },
        {},
        { client: trx }
      )
      await membership.related('roles').sync([invitation.roleId], false)

      // Certifications recorded on the invitation move to the membership.
      if (invitation.certifications?.length) {
        const merged = [
          ...new Set([...(membership.certifications ?? []), ...invitation.certifications]),
        ]
        membership.certifications = merged
        await membership.save()
      }

      // Convert this invitation's class-instructor rows to the membership;
      // drop rows where the member already instructs the class.
      await trx
        .from('class_instructors')
        .where('invitation_id', invitation.id)
        .whereIn(
          'swimming_class_id',
          trx
            .from('class_instructors')
            .where('membership_id', membership.id)
            .select('swimming_class_id')
        )
        .delete()
      await trx
        .from('class_instructors')
        .where('invitation_id', invitation.id)
        .update({ membership_id: membership.id, invitation_id: null })

      const school = await School.findOrFail(invitation.schoolId, { client: trx })

      user.useTransaction(trx)
      user.activeOrganisationId = school.organisationId
      user.activeSchoolId = invitation.schoolId
      await user.save()

      if (invitation.isPending) {
        invitation.useTransaction(trx)
        invitation.acceptedAt = DateTime.now()
        await invitation.save()
      }

      return user
    })
  }
}
