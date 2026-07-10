import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import Membership from '#models/membership'
import School from '#models/school'

export default class ActiveSchoolMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.getUserOrFail()

    if (user.activeSchoolId) {
      const activeSchool = await School.find(user.activeSchoolId)

      if (activeSchool && user.activeOrganisationId === activeSchool.organisationId) {
        return next()
      }

      if (activeSchool && !user.activeOrganisationId) {
        user.activeOrganisationId = activeSchool.organisationId
        await user.save()
        return next()
      }
    }

    const replacementMembership = await Membership.query()
      .where('userId', user.id)
      .whereHas('school', (schoolQuery) => {
        if (user.activeOrganisationId) {
          schoolQuery.where('organisationId', user.activeOrganisationId)
        }
      })
      .preload('school')
      .orderBy('id')
      .first()

    if (replacementMembership) {
      user.activeOrganisationId = replacementMembership.school.organisationId
      user.activeSchoolId = replacementMembership.schoolId
      await user.save()
      return next()
    }

    user.activeOrganisationId = null
    user.activeSchoolId = null
    await user.save()

    return ctx.response.redirect().toRoute('schools.create')
  }
}
