import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ClubFoundingService from '#services/club_founding_service'
import { storeClubValidator } from '#validators/club'

export default class ClubsController {
  create({ inertia }: HttpContext) {
    return inertia.render('clubs/create', {})
  }

  @inject()
  async store(
    { auth, request, response, session }: HttpContext,
    clubFounding: ClubFoundingService
  ) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(storeClubValidator, { meta: { userId: user.id } })
    const club = await clubFounding.found(user, payload)

    session.flash('success', `${club.name} created`)
    return response.redirect().toRoute('home')
  }
}
