import type { HttpContext } from '@adonisjs/core/http'
import SchoolActivityCategory from '#models/school_activity_category'
import { updateSchoolActivityCategoryValidator } from '#validators/bank'

export default class ActivityBankCategoriesController {
  async update({ auth, request, response, params, session }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const payload = await request.validateUsing(updateSchoolActivityCategoryValidator)
    const category = await SchoolActivityCategory.query()
      .where('id', params.id)
      .where('schoolId', schoolId)
      .firstOrFail()

    category.name = payload.name
    await category.save()

    session.flash('success', 'Activity category renamed.')
    return response.redirect().toRoute('activity_bank.index')
  }

  async destroy({ auth, response, params, session }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const category = await SchoolActivityCategory.query()
      .where('id', params.id)
      .where('schoolId', schoolId)
      .firstOrFail()

    category.isActive = false
    await category.save()

    session.flash('success', 'Activity category disabled.')
    return response.redirect().toRoute('activity_bank.index')
  }
}
