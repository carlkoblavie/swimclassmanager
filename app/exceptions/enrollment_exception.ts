import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class EnrollmentException extends Exception {
  static status = 400
  static code = 'E_ENROLLMENT'

  constructor(message = 'Unable to enroll.') {
    super(message)
  }

  async handle(_error: this, ctx: HttpContext) {
    ctx.session.flashAll()
    ctx.session.flash('error', this.message)
    return ctx.response.redirect().back()
  }
}
