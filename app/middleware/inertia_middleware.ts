import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import Club from '#models/club'
import Membership from '#models/membership'
import UserTransformer from '#transformers/user_transformer'
import ClubTransformer from '#transformers/club_transformer'
import { permissions } from '#start/permissions'
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'

export default class InertiaMiddleware extends BaseInertiaMiddleware {
  async share(ctx: HttpContext) {
    /**
     * The share method is called everytime an Inertia page is rendered. In
     * certain cases, a page may get rendered before the session middleware
     * or the auth middleware are executed. For example: During a 404 request.
     */
    const { session, auth } = ctx as Partial<HttpContext>

    const error = session?.flashMessages.get('error') as string
    const success = session?.flashMessages.get('success') as string

    const activeClubId = auth?.user?.activeClubId
    const activeClub = activeClubId ? await Club.find(activeClubId) : null

    /**
     * The permission keys the current user holds through their active-club
     * membership. Empty for guests or users without an active-club membership.
     */
    let userPermissions: string[] = []
    if (auth?.user && activeClubId) {
      const membership = await Membership.query()
        .where('clubId', activeClubId)
        .where('userId', auth.user.id)
        .first()
      if (membership) {
        const access = await permissions.createAccessFor(membership)
        userPermissions = access.permissions()
      }
    }

    return {
      errors: ctx.inertia.always(this.getValidationErrors(ctx)),
      flash: ctx.inertia.always({
        error,
        success,
      }),
      user: ctx.inertia.always(auth?.user ? UserTransformer.transform(auth.user) : undefined),
      activeClub: ctx.inertia.always(
        activeClub ? ClubTransformer.transform(activeClub) : undefined
      ),
      userPermissions: ctx.inertia.always(userPermissions),
    }
  }

  async handle(ctx: HttpContext, next: NextFn) {
    await this.init(ctx)

    const output = await next()
    this.dispose(ctx)

    return output
  }
}

declare module '@adonisjs/inertia/types' {
  type MiddlewareSharedProps = InferSharedProps<InertiaMiddleware>
  export interface SharedProps extends MiddlewareSharedProps {}
}
