import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import School from '#models/school'
import SwimYear from '#models/swim_year'
import SwimYearAuthoringService from '#services/swim_year_authoring_service'
import SwimYearTransformer from '#transformers/swim_year_transformer'
import { storeSwimYearValidator, updateSwimYearValidator } from '#validators/swim_year'

export default class SwimYearsController {
  /**
   * The settings page listing the school's swim years and terms
   */
  async index({ auth, inertia }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!

    const swimYears = await SwimYear.query()
      .where('schoolId', schoolId)
      .preload('terms', (termsQuery) => termsQuery.withCount('swimmingClasses').orderBy('position'))
      .orderBy('startsOn', 'desc')

    return inertia.render('settings/swim_years', {
      swimYears: SwimYearTransformer.transform(swimYears),
    })
  }

  /**
   * Create a swim year with its terms
   */
  @inject()
  async store(
    { auth, request, response, session }: HttpContext,
    authoring: SwimYearAuthoringService
  ) {
    const school = await School.findOrFail(auth.getUserOrFail().activeSchoolId!)
    const payload = await request.validateUsing(storeSwimYearValidator)

    const swimYear = await authoring.create(school, payload)

    session.flash('success', `Swim year ${swimYear.name} created.`)
    return response.redirect().toRoute('swim_years.index')
  }

  /**
   * Update a swim year and sync its terms
   */
  @inject()
  async update(
    { auth, params, request, response, session }: HttpContext,
    authoring: SwimYearAuthoringService
  ) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const swimYear = await SwimYear.query()
      .where('id', params.id)
      .where('schoolId', schoolId)
      .firstOrFail()

    const payload = await request.validateUsing(updateSwimYearValidator)
    await authoring.update(swimYear, payload)

    session.flash('success', `Swim year ${swimYear.name} updated.`)
    return response.redirect().toRoute('swim_years.index')
  }

  /**
   * Delete a swim year (refused while classes are tied to its terms)
   */
  @inject()
  async destroy(
    { auth, params, response, session }: HttpContext,
    authoring: SwimYearAuthoringService
  ) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const swimYear = await SwimYear.query()
      .where('id', params.id)
      .where('schoolId', schoolId)
      .firstOrFail()

    await authoring.destroy(swimYear)

    session.flash('success', `Swim year ${swimYear.name} removed.`)
    return response.redirect().toRoute('swim_years.index')
  }
}
