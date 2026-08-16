import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ClassLesson from '#models/class_lesson'
import School from '#models/school'
import SwimmingClass from '#models/swimming_class'
import ClassSeriesAuthoringService from '#services/class_series_authoring_service'
import Membership from '#models/membership'
import { RoleName } from '#values/role'
import {
  assignLessonInstructorsValidator,
  bulkAssignLessonInstructorsValidator,
  copyLessonActivitiesValidator,
  storeClassLessonValidator,
  updateLessonActivitiesValidator,
} from '#validators/swimming_class'

async function lessonForUser(lessonId: number, schoolId: number, userId: number) {
  const membership = await Membership.query()
    .where('schoolId', schoolId)
    .where('userId', userId)
    .preload('roles')
    .first()
  const isInstructor = membership?.roles.some(
    (role) => role.name === RoleName.TEACHER || role.name === RoleName.ASSISTANT_COACH
  )

  const query = ClassLesson.query()
    .where('id', lessonId)
    .whereHas('swimmingClass', (classQuery) => classQuery.where('schoolId', schoolId))
  if (isInstructor && membership) {
    query.whereHas('lessonInstructors', (instructorsQuery) =>
      instructorsQuery.where('membershipId', membership.id)
    )
  }

  return query.firstOrFail()
}

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
    const lesson = await authoring.planLesson(swimmingClass, payload)

    session.flash('success', 'Lesson planned.')
    return response
      .redirect()
      .toRoute('swimming_classes.show', { id: swimmingClass.id }, { qs: { lessonId: lesson.id } })
  }

  /**
   * Update a lesson's activities and notes
   */
  @inject()
  async update(
    { auth, request, response, params, session }: HttpContext,
    authoring: ClassSeriesAuthoringService
  ) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const lesson = await lessonForUser(params.id, schoolId, auth.getUserOrFail().id)

    const payload = await request.validateUsing(storeClassLessonValidator)
    await authoring.updateLesson(lesson, payload)

    session.flash('success', 'Lesson updated.')
    return response.redirect().toRoute('swimming_classes.show', { id: lesson.swimmingClassId })
  }

  /** Update only the activity plan, without changing lesson details. */
  @inject()
  async updateActivities(
    { auth, request, response, params, session }: HttpContext,
    authoring: ClassSeriesAuthoringService
  ) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const lesson = await lessonForUser(params.id, schoolId, auth.getUserOrFail().id)

    const payload = await request.validateUsing(updateLessonActivitiesValidator)
    await authoring.updateLessonActivities(lesson, payload)

    session.flash('success', 'Lesson activities updated.')
    return response.redirect().toRoute('swimming_classes.show', { id: lesson.swimmingClassId })
  }

  /** Copy one lesson's activities into selected empty lessons in the same stage. */
  @inject()
  async copyActivities(
    { auth, request, response, params, session }: HttpContext,
    authoring: ClassSeriesAuthoringService
  ) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const sourceLesson = await lessonForUser(params.id, schoolId, auth.getUserOrFail().id)

    const payload = await request.validateUsing(copyLessonActivitiesValidator)
    const copiedCount = await authoring.copyLessonActivities(sourceLesson, payload.targetLessonIds)

    session.flash(
      'success',
      `Activities copied into ${copiedCount} ${copiedCount === 1 ? 'lesson' : 'lessons'}.`
    )
    return response.redirect().back()
  }

  /** Assign a lead instructor and optional supporting instructors to one lesson. */
  @inject()
  async assignInstructors(
    { auth, request, response, params, session }: HttpContext,
    authoring: ClassSeriesAuthoringService
  ) {
    const school = await School.findOrFail(auth.getUserOrFail().activeSchoolId!)
    const lesson = await lessonForUser(params.id, school.id, auth.getUserOrFail().id)

    const payload = await request.validateUsing(assignLessonInstructorsValidator)
    await authoring.assignLessonInstructors(lesson, school, payload)

    session.flash('success', 'Lesson instructors updated.')
    return response.redirect().toPath(`/classes/${lesson.swimmingClassId}?lessonId=${lesson.id}`)
  }

  /** Assign the same lead and supporting instructors to multiple lessons. */
  @inject()
  async bulkAssignInstructors(
    { auth, request, response, session }: HttpContext,
    authoring: ClassSeriesAuthoringService
  ) {
    const school = await School.findOrFail(auth.getUserOrFail().activeSchoolId!)
    const payload = await request.validateUsing(bulkAssignLessonInstructorsValidator)
    const lessons = await ClassLesson.query()
      .whereIn('id', payload.lessonIds)
      .whereHas('swimmingClass', (classQuery) => classQuery.where('schoolId', school.id))

    if (lessons.length !== payload.lessonIds.length) {
      return response.redirect().back()
    }

    await authoring.bulkAssignLessonInstructors(lessons, school, payload)

    session.flash(
      'success',
      `Instructors assigned to ${lessons.length} ${lessons.length === 1 ? 'lesson' : 'lessons'}.`
    )
    return response.redirect().back()
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
