import { DateTime } from 'luxon'
import string from '@adonisjs/core/helpers/string'
import mail from '@adonisjs/mail/services/main'
import type { HttpContext } from '@adonisjs/core/http'
import Club from '#models/club'
import Role from '#models/role'
import Invitation from '#models/invitation'
import InvitationMail from '#mails/invitation'
import { storeInvitationValidator } from '#validators/invitation'
import { RoleName } from '#values/role'

const INVITABLE_ROLES: string[] = [
  RoleName.HEAD_COACH,
  RoleName.TEACHER,
  RoleName.DECK_SUPERVISOR,
  RoleName.PARENT,
]

export default class InvitationsController {
  create({ inertia }: HttpContext) {
    return inertia.render('invitations/create', { roles: INVITABLE_ROLES })
  }

  async store({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const clubId = user.activeClubId!
    const payload = await request.validateUsing(storeInvitationValidator, { meta: { clubId } })

    const role = await Role.findByOrFail('name', payload.role)
    const club = await Club.findOrFail(clubId)

    const invitation = await Invitation.updateOrCreate(
      { clubId, email: payload.email },
      {
        roleId: role.id,
        token: string.random(48),
        expiresAt: DateTime.now().plus({ days: 7 }),
        acceptedAt: null,
      }
    )

    await mail.sendLater(
      new InvitationMail(invitation.email, invitation.token, club.name, payload.role)
    )

    session.flash('success', `Invitation sent to ${invitation.email}.`)
    return response.redirect().toRoute('home')
  }
}
