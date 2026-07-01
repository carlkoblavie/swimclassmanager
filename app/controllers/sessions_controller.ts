import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionsController {
  async store({ request, auth, response, session }: HttpContext) {
    if (!request.hasValidSignature()) {
      session.flash('error', 'This sign-in link has expired. Request a new one.')
      return response.redirect().toRoute('sign_in_links.create')
    }

    const email = request.qs().email as string
    const user = await User.firstOrCreate({ email })

    await auth.use('web').login(user)

    if (!user.isProfileComplete) {
      return response.redirect().toRoute('accounts.edit')
    }
    return response.redirect().toRoute('home')
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toRoute('sign_in_links.create')
  }
}
