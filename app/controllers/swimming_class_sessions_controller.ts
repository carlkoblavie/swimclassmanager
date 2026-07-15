import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ClassAuthoringException from '#exceptions/class_authoring_exception'
import SwimmingClassSession from '#models/swimming_class_session'
import ClassSeriesAuthoringService from '#services/class_series_authoring_service'

export default class SwimmingClassSessionsController {
  @inject()
  async update(
    { auth, request, response, params, session }: HttpContext,
    authoring: ClassSeriesAuthoringService
  ) {
    if (request.input('intent') !== 'cancel') {
      throw new ClassAuthoringException('Unable to cancel the session.')
    }

    const schoolId = auth.getUserOrFail().activeSchoolId!
    const classSession = await SwimmingClassSession.query()
      .where('id', params.id)
      .whereHas('swimmingClass', (classQuery) => classQuery.where('schoolId', schoolId))
      .firstOrFail()

    await authoring.cancelSession(classSession)
    session.flash('success', 'Session cancelled.')

    return response
      .redirect()
      .toRoute('swimming_classes.show', { id: classSession.swimmingClassId })
  }
}
