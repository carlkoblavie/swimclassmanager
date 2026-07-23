import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class ForcePasswordChangeMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.getUserOrFail()

    if (user.mustChangePassword) {
      return ctx.response.redirect().toRoute('account_passwords.edit')
    }

    return next()
  }
}
