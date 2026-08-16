import { DateTime } from 'luxon'
import string from '@adonisjs/core/helpers/string'
import type { HttpContext } from '@adonisjs/core/http'
import router from '@adonisjs/core/services/router'
import Role from '#models/role'
import Invitation from '#models/invitation'
import { appUrl } from '#config/app'
import { storeInvitationValidator } from '#validators/invitation'
import { RoleName } from '#values/role'

const INVITABLE_ROLES = [
  { value: RoleName.TEACHER, label: 'Instructor' },
  { value: RoleName.ASSISTANT_COACH, label: RoleName.ASSISTANT_COACH },
  { value: RoleName.DECK_SUPERVISOR, label: RoleName.DECK_SUPERVISOR },
  { value: RoleName.PARENT, label: RoleName.PARENT, disabled: true },
]

export default class InvitationsController {
  create({ inertia, session }: HttpContext) {
    const invitation = session.flashMessages.get('invitation') as
      | { name: string; email: string; link: string }
      | undefined

    return inertia.render('invitations/create', {
      roles: INVITABLE_ROLES,
      invitation,
    })
  }

  async store({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const schoolId = user.activeSchoolId!
    const organisationId = user.activeOrganisationId!
    const payload = await request.validateUsing(storeInvitationValidator, {
      meta: { schoolId, organisationId },
    })

    const role = await Role.findByOrFail('name', payload.role)
    const invitation = await Invitation.updateOrCreate(
      { schoolId, email: payload.email },
      {
        roleId: role.id,
        inviteeFirstName: payload.firstName,
        inviteeLastName: payload.lastName,
        inviteePhone: payload.phone,
        token: string.random(48),
        expiresAt: DateTime.now().plus({ days: 7 }),
        acceptedAt: null,
      }
    )

    const link = router.makeUrl(
      'memberships.store',
      { token: invitation.token },
      { prefixUrl: appUrl }
    )

    session.flash('success', `Invitation created for ${invitation.email}.`)
    session.flash('invitation', {
      name: `${payload.firstName} ${payload.lastName}`,
      email: invitation.email,
      link,
    })
    return response.redirect().toRoute('invitations.create')
  }
}
