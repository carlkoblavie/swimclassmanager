import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ClassLesson from '#models/class_lesson'
import SwimmingClass from '#models/swimming_class'
import ClassSeriesAuthoringService from '#services/class_series_authoring_service'
import { storeClassLessonValidator } from '#validators/swimming_class'

export default class ClassLessonsController {
  /**
   * Plan a dated lesson for a class
   */
  @inject()
  async store(
    { auth, request, response, params, session }: HttpContext,
    authoring: ClassSeriesAuthoringService
  ) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const swimmingClass = await SwimmingClass.query()
      .where('id', params.id)
      .where('schoolId', schoolId)
      .firstOrFail()

    const payload = await request.validateUsing(storeClassLessonValidator)
    await authoring.planLesson(swimmingClass, payload)

    session.flash('success', 'Lesson planned.')
    return response.redirect().toRoute('swimming_classes.show', { id: swimmingClass.id })
  }

  /**
   * Remove a planned lesson
   */
  @inject()
  async destroy(
    { auth, response, params, session }: HttpContext,
    authoring: ClassSeriesAuthoringService
  ) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const lesson = await ClassLesson.query()
      .where('id', params.id)
      .whereHas('swimmingClass', (classQuery) => classQuery.where('schoolId', schoolId))
      .firstOrFail()

    await authoring.removeLesson(lesson)

    session.flash('success', 'Lesson removed.')
    return response.redirect().toRoute('swimming_classes.show', { id: lesson.swimmingClassId })
  }
}
