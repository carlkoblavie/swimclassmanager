import AccountTransformer from '#transformers/account_transformer'
import { updateAccountValidator } from '#validators/account'
import type { HttpContext } from '@adonisjs/core/http'

export default class AccountsController {
  async edit({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return inertia.render('account/complete_profile', {
      account: AccountTransformer.transform(user),
    })
  }

  async update({ request, response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateAccountValidator)

    await user.completeProfile(payload)

    session.flash('success', 'Profile completed')
    return response.redirect().toRoute('home')
  }
}
