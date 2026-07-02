import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Membership from '#models/membership'
import type Invitation from '#models/invitation'

export default class InvitationAcceptanceService {
  /**
   * Accept an invitation: find-or-create the user by email, join them to the
   * club with the invited role, set it active, and stamp the invitation. All
   * in one transaction; idempotent for an already-accepted invitation.
   */
  async accept(invitation: Invitation): Promise<User> {
    return db.transaction(async (trx) => {
      const user = await User.firstOrCreate({ email: invitation.email }, {}, { client: trx })

      const membership = await Membership.firstOrCreate(
        { clubId: invitation.clubId, userId: user.id },
        {},
        { client: trx }
      )
      await membership.related('roles').sync([invitation.roleId], false)

      user.useTransaction(trx)
      user.activeClubId = invitation.clubId
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
