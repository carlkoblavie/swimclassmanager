import { updatePasswordValidator } from '#validators/sign_in_link'
import type { HttpContext } from '@adonisjs/core/http'

export default class AccountPasswordsController {
  async edit({ inertia }: HttpContext) {
    return inertia.render('account/change_password', {})
  }

  async update({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const { password } = await request.validateUsing(updatePasswordValidator)

    await user.changePassword(password)

    session.flash('success', 'Password updated')
    return response.redirect().toRoute('home')
  }
}
