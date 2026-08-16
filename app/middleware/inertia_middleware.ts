import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import School from '#models/school'
import Organisation from '#models/organisation'
import Membership from '#models/membership'
import UserTransformer from '#transformers/user_transformer'
import SchoolTransformer from '#transformers/school_transformer'
import OrganisationTransformer from '#transformers/organisation_transformer'
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

    const activeOrganisationId = auth?.user?.activeOrganisationId
    const activeSchoolId = auth?.user?.activeSchoolId

    const activeOrganisation = activeOrganisationId
      ? await Organisation.find(activeOrganisationId)
      : null
    const activeSchool = activeSchoolId ? await School.find(activeSchoolId) : null
    const availableSchools = activeOrganisationId
      ? await School.query().where('organisationId', activeOrganisationId).orderBy('name')
      : []

    /**
     * The permission keys the current user holds through their active-school
     * membership. Empty for guests or users without an active-school membership.
     */
    let userPermissions: string[] = []
    let activeRole: string | undefined
    if (auth?.user && activeSchoolId) {
      const membership = await Membership.query()
        .where('schoolId', activeSchoolId)
        .where('userId', auth.user.id)
        .preload('roles')
        .first()
      if (membership) {
        activeRole = membership.roles[0]?.name ?? null
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
      activeOrganisation: ctx.inertia.always(
        activeOrganisation ? OrganisationTransformer.transform(activeOrganisation) : undefined
      ),
      activeSchool: ctx.inertia.always(
        activeSchool ? SchoolTransformer.transform(activeSchool) : undefined
      ),
      availableSchools: ctx.inertia.always(SchoolTransformer.transform(availableSchools)),
      userPermissions: ctx.inertia.always(userPermissions),
      activeRole: ctx.inertia.always(activeRole),
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
