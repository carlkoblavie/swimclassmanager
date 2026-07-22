import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import School from '#models/school'
import CustomerCatalogService from '#services/customer_catalog_service'

export default class CustomerPlansController {
  /**
   * Public: every active program with its available levels for the school,
   * plus the current swim year and its terms. Renders the purchase catalog.
   */
  @inject()
  async index({ params }: HttpContext, catalog: CustomerCatalogService) {
    const school = await this.resolveSchool(params.organisationSlug, params.schoolSlug)
    return catalog.plansFor(school)
  }

  /**
   * Public: one program's available levels (by program public id).
   */
  @inject()
  async show({ params }: HttpContext, catalog: CustomerCatalogService) {
    const school = await this.resolveSchool(params.organisationSlug, params.schoolSlug)
    return catalog.programPlanFor(school, params.programId)
  }

  private resolveSchool(organisationSlug: string, schoolSlug: string): Promise<School> {
    return School.query()
      .where('slug', schoolSlug)
      .whereHas('organisation', (organisationQuery) => {
        organisationQuery.where('slug', organisationSlug)
      })
      .preload('organisation')
      .firstOrFail()
  }
}
