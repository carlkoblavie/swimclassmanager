import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class SwimYearAuthoringException extends Exception {
  static status = 400
  static code = 'E_SWIM_YEAR_AUTHORING'

  constructor(message = 'Unable to save the swim year.') {
    super(message)
  }

  async handle(_error: this, ctx: HttpContext) {
    ctx.session.flashAll()
    ctx.session.flash('error', this.message)
    return ctx.response.redirect().back()
  }
}
