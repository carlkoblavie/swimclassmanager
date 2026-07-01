import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class CompleteProfileMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.getUserOrFail()

    if (!user.isProfileComplete) {
      return ctx.response.redirect().toRoute('accounts.edit')
    }

    return next()
  }
}
