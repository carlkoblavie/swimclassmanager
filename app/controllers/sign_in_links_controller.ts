import mail from '@adonisjs/mail/services/main'
import MagicLinkMail from '#mails/magic_link'
import { storeSignInLinkValidator } from '#validators/sign_in_link'
import type { HttpContext } from '@adonisjs/core/http'

export default class SignInLinksController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/login', {})
  }

  async store({ request, response, session }: HttpContext) {
    const { email } = await request.validateUsing(storeSignInLinkValidator)

    await mail.sendLater(new MagicLinkMail(email))

    session.flash('success', 'Check your email for a sign-in link.')
    return response.redirect().toRoute('sign_in_links.create')
  }
}
