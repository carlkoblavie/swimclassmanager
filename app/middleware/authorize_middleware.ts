import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { AuthorizationResponse, errors } from '@adonisjs/bouncer'
import { permissions, type PermissionKey } from '#start/permissions'
import Membership from '#models/membership'

/**
 * Scope-membership authorization: the subject is the current user's membership
 * in their active club. Denies when they have no such membership or it lacks
 * the required permission.
 */
export default class AuthorizeMiddleware {
  async handle(ctx: HttpContext, next: NextFn, ability: PermissionKey) {
    const user = ctx.auth.getUserOrFail()

    const membership = await Membership.query()
      .where('clubId', user.activeClubId!)
      .where('userId', user.id)
      .first()

    if (!membership) {
      throw new errors.E_AUTHORIZATION_FAILURE(AuthorizationResponse.deny('Access denied', 403))
    }

    const access = await permissions.createAccessFor(membership)
    if (!access.allows(ability)) {
      throw new errors.E_AUTHORIZATION_FAILURE(AuthorizationResponse.deny('Access denied', 403))
    }

    return next()
  }
}
