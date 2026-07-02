import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class ActiveClubMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.getUserOrFail()

    if (!user.activeClubId) {
      return ctx.response.redirect().toRoute('clubs.create')
    }

    return next()
  }
}
