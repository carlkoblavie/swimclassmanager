import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SchoolFoundingService from '#services/school_founding_service'
import Membership from '#models/membership'
import OrganisationTransformer from '#transformers/organisation_transformer'
import { permissions } from '#start/permissions'
import { storeSchoolValidator } from '#validators/school'
import type Organisation from '#models/organisation'

export default class SchoolsController {
  async create({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const memberships = await Membership.query()
      .where('userId', user.id)
      .preload('school', (schoolQuery) => schoolQuery.preload('organisation'))

    const organisationsById = new Map<number, Organisation>()
    for (const membership of memberships) {
      const access = await permissions.createAccessFor(membership)
      if (access.allows('school.create')) {
        organisationsById.set(membership.school.organisation.id, membership.school.organisation)
      }
    }

    return inertia.render('schools/create', {
      organisations: OrganisationTransformer.transform([...organisationsById.values()]),
      firstSchool: memberships.length === 0,
    })
  }

  @inject()
  async store(
    { auth, request, response, session }: HttpContext,
    schoolFounding: SchoolFoundingService
  ) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(storeSchoolValidator, { meta: { userId: user.id } })

    if (!payload.organisationId && !payload.organisationName) {
      session.flash('error', 'Enter an organisation name.')
      return response.redirect().back()
    }

    const school = await schoolFounding.found(user, payload)

    session.flash('success', `${school.name} created`)
    return response.redirect().toRoute('home')
  }
}
