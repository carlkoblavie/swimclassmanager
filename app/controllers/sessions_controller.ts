import User from '#models/user'
import { storeSessionValidator } from '#validators/sign_in_link'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionsController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/login', {})
  }

  async store({ request, auth, response, session }: HttpContext) {
    if (request.method() === 'POST') {
      const { email, password } = await request.validateUsing(storeSessionValidator)
      const user = await User.verifyCredentials(email, password)

      await auth.use('web').login(user)

      if (user.mustChangePassword) {
        return response.redirect().toRoute('account_passwords.edit')
      }
      return response.redirect().toRoute('home')
    }

    if (!request.hasValidSignature()) {
      session.flash('error', 'This sign-in link has expired. Request a new one.')
      return response.redirect().toRoute('sign_in_links.create')
    }

    const email = request.qs().email as string
    const user = await User.firstOrCreate({ email })

    await auth.use('web').login(user)

    if (user.mustChangePassword) {
      return response.redirect().toRoute('account_passwords.edit')
    }
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
