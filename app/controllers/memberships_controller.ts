import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import Invitation from '#models/invitation'
import InvitationAcceptanceService from '#services/invitation_acceptance_service'

export default class MembershipsController {
  @inject()
  async store(
    { params, auth, response, session }: HttpContext,
    invitationAcceptance: InvitationAcceptanceService
  ) {
    const invitation = await Invitation.query()
      .where('token', params.token)
      .preload('role')
      .preload('school', (schoolQuery) => schoolQuery.preload('organisation'))
      .first()

    if (!invitation || (invitation.isPending && invitation.isExpired)) {
      session.flash(
        'error',
        'This invitation has expired. Ask the person who invited you for a new one.'
      )
      return response.redirect().toRoute('sign_in_links.create')
    }

    const user = await invitationAcceptance.accept(invitation)
    await auth.use('web').login(user)

    return response.redirect().toRoute('home')
  }
}
