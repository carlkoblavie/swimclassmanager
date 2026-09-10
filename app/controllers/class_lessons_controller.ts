import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import ClassLesson from '#models/class_lesson'
import SwimmingClass from '#models/swimming_class'
import ClassSeriesAuthoringService from '#services/class_series_authoring_service'
import Membership from '#models/membership'
import StageInstructor from '#models/stage_instructor'
import { ClassInstructorRole } from '#values/class_instructor_role'
import { RoleName } from '#values/role'

/**
 * True when the user may manage (generate/plan/remove) lessons for a class:
 * managers always, instructors only when they lead the class's stage.
 */
async function canManageStageLessons(
  schoolId: number,
  userId: number,
  levelStageId: number
): Promise<boolean> {
  const membership = await Membership.query()
    .where('schoolId', schoolId)
    .where('userId', userId)
    .preload('roles')
    .first()
  const isInstructor = membership?.roles.some(
    (role) => role.name === RoleName.TEACHER || role.name === RoleName.ASSISTANT_COACH
  )
  if (!isInstructor || !membership) {
    return true
  }
  const lead = await StageInstructor.query()
    .where('schoolId', schoolId)
    .where('levelStageId', levelStageId)
    .where('membershipId', membership.id)
    .where('role', ClassInstructorRole.LEAD)
    .first()
  return Boolean(lead)
}
import {
  copyLessonActivitiesValidator,
  storeClassLessonValidator,
  updateLessonActivitiesValidator,
  updateLessonPlanValidator,
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
  // Only the LEAD instructor of a stage may edit its lessons; supporting
  // instructors are read-only. Managers (non-instructors) bypass this.
  if (isInstructor && membership) {
    query.whereHas('swimmingClass', (classQuery) =>
      classQuery.whereExists((existsQuery) => {
        existsQuery
          .from('stage_instructors')
          .whereColumn('stage_instructors.level_stage_id', 'swimming_classes.level_stage_id')
          .where('stage_instructors.school_id', schoolId)
          .where('stage_instructors.membership_id', membership.id)
          .where('stage_instructors.role', ClassInstructorRole.LEAD)
      })
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
    const user = auth.getUserOrFail()
    const schoolId = user.activeSchoolId!
    const swimmingClass = await SwimmingClass.query()
      .where('id', params.id)
      .where('schoolId', schoolId)
      .firstOrFail()

    if (!(await canManageStageLessons(schoolId, user.id, swimmingClass.levelStageId))) {
      session.flash('error', 'Only the lead instructor for this stage can plan its lessons.')
      return response.redirect().back()
    }

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
    return response.redirect().toRoute(
      'swimming_classes.show',
      { id: lesson.swimmingClassId },
      {
        qs: { lessonId: lesson.id },
      }
    )
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
    return response.redirect().toRoute(
      'swimming_classes.show',
      { id: lesson.swimmingClassId },
      {
        qs: { lessonId: lesson.id },
      }
    )
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

  /** Update one lesson's plan: date/time, objectives, and skills. */
  @inject()
  async updatePlan(
    { auth, request, response, params, session }: HttpContext,
    authoring: ClassSeriesAuthoringService
  ) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const lesson = await lessonForUser(params.id, schoolId, auth.getUserOrFail().id)

    const payload = await request.validateUsing(updateLessonPlanValidator)
    await authoring.updateLessonPlan(lesson, payload)

    session.flash('success', 'Lesson updated.')
    return response.redirect().toPath(`/classes/${lesson.swimmingClassId}?lessonId=${lesson.id}`)
  }

  /**
   * Remove a planned lesson
   */
  @inject()
  async destroy(
    { auth, response, params, session }: HttpContext,
    authoring: ClassSeriesAuthoringService
  ) {
    const user = auth.getUserOrFail()
    const schoolId = user.activeSchoolId!
    const lesson = await ClassLesson.query()
      .where('id', params.id)
      .whereHas('swimmingClass', (classQuery) => classQuery.where('schoolId', schoolId))
      .preload('swimmingClass')
      .firstOrFail()

    if (!(await canManageStageLessons(schoolId, user.id, lesson.swimmingClass.levelStageId))) {
      session.flash('error', 'Only the lead instructor for this stage can remove its lessons.')
      return response.redirect().back()
    }

    // A lesson that has already been taught (today or in the past) can't be
    // removed — take attendance instead.
    if (lesson.date.toISODate()! <= DateTime.now().toISODate()!) {
      session.flash('error', 'Past lessons can’t be removed.')
      return response.redirect().back()
    }

    const classId = lesson.swimmingClassId
    await authoring.removeLesson(lesson)

    session.flash('success', 'Lesson removed.')
    return response.redirect().toRoute('lessons.index', {}, { qs: { classId } })
  }
}
