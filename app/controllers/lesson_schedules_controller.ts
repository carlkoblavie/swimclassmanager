import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ClassAuthoringException from '#exceptions/class_authoring_exception'
import ClassLessonCapacityService from '#services/class_lesson_capacity_service'
import Invitation from '#models/invitation'
import Membership from '#models/membership'
import SwimmingClass from '#models/swimming_class'
import ClassSeriesAuthoringService from '#services/class_series_authoring_service'
import InvitationTransformer from '#transformers/invitation_transformer'
import MembershipTransformer from '#transformers/membership_transformer'
import SwimmingClassTransformer from '#transformers/swimming_class_transformer'
import { generateClassLessonsValidator } from '#validators/swimming_class'
import { RoleName } from '#values/role'

export default class LessonSchedulesController {
  /**
   * Bulk-generate empty lesson dates for existing classes.
   */
  async index({ auth, inertia, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const schoolId = user.activeSchoolId!
    const selectedClassId = Number(request.input('classId') ?? 0) || null
    const showGenerator = request.input('generate') === '1'
    const membership = await Membership.query()
      .where('schoolId', schoolId)
      .where('userId', user.id)
      .preload('roles')
      .first()
    const isInstructor = membership?.roles.some(
      (role) => role.name === RoleName.TEACHER || role.name === RoleName.ASSISTANT_COACH
    )
    const instructorMembershipId = isInstructor ? membership?.id : null

    const classesQuery = SwimmingClass.query().where('schoolId', schoolId).whereNull('cancelledAt')
    if (instructorMembershipId) {
      classesQuery.whereHas('lessons', (lessonsQuery) =>
        lessonsQuery.whereHas('lessonInstructors', (instructorsQuery) =>
          instructorsQuery.where('membershipId', instructorMembershipId)
        )
      )
    }

    const classes = await classesQuery
      .preload('level', (levelQuery) => levelQuery.preload('program'))
      .preload('term', (termQuery) => termQuery.preload('swimYear'))
      .preload('levelStage')
      .preload('prerequisiteStage', (stageQuery) => stageQuery.preload('level'))
      .preload('classSkills', (skillsQuery) =>
        skillsQuery.preload('skillBankSkill').preload('levelStageSkill')
      )
      .preload('lessons', (lessonsQuery) =>
        (instructorMembershipId
          ? lessonsQuery.whereHas('lessonInstructors', (instructorsQuery) =>
              instructorsQuery.where('membershipId', instructorMembershipId)
            )
          : lessonsQuery
        )
          .preload('lessonActivities', (activitiesQuery) =>
            activitiesQuery
              .preload('levelStageActivity')
              .preload('schoolActivity', (activityQuery) => activityQuery.preload('category'))
              .orderBy('position')
          )
          .preload('lessonInstructors', (instructorsQuery) =>
            instructorsQuery
              .preload('membership', (membershipQuery) => membershipQuery.preload('user'))
              .preload('invitation')
          )
          .orderBy('date')
      )
      .orderBy('levelStageId')
      .orderBy('name')
    const levelLessonCounts = await new ClassLessonCapacityService().countByLevel(
      schoolId,
      classes.map((swimmingClass) => swimmingClass.levelId)
    )

    const [instructorMemberships, pendingInstructorInvitations] = await Promise.all([
      Membership.query()
        .where('schoolId', schoolId)
        .whereHas('roles', (rolesQuery) =>
          rolesQuery.whereIn('name', [
            RoleName.TEACHER,
            RoleName.ASSISTANT_COACH,
            RoleName.HEAD_COACH,
          ])
        )
        .preload('user')
        .orderBy('id'),
      Invitation.query()
        .where('schoolId', schoolId)
        .whereHas('role', (roleQuery) =>
          roleQuery.whereIn('name', [RoleName.TEACHER, RoleName.ASSISTANT_COACH])
        )
        .whereNull('acceptedAt')
        .orderBy('id'),
    ])

    return inertia.render('lessons/index', {
      classes: SwimmingClassTransformer.transform(classes, levelLessonCounts),
      instructorOptions: MembershipTransformer.transform(instructorMemberships),
      pendingInstructorOptions: InvitationTransformer.transform(pendingInstructorInvitations),
      selectedClassId,
      showGenerator,
    })
  }

  /**
   * Create empty lessons for every selected weekday in a date window.
   */
  @inject()
  async store(
    { auth, request, response, session }: HttpContext,
    authoring: ClassSeriesAuthoringService
  ) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const payload = await request.validateUsing(generateClassLessonsValidator)
    const swimmingClass = await SwimmingClass.query()
      .where('id', payload.classId)
      .where('schoolId', schoolId)
      .whereNull('cancelledAt')
      .firstOrFail()

    try {
      const lessons = await authoring.generateLessons(swimmingClass, payload)
      session.flash(
        'success',
        `${lessons.length} ${lessons.length === 1 ? 'lesson' : 'lessons'} generated.`
      )
    } catch (error) {
      if (error instanceof ClassAuthoringException) {
        session.flash('error', error.message)
        return response.redirect().back()
      }
      throw error
    }

    return response.redirect().toPath(`/lessons?classId=${swimmingClass.id}`)
  }
}
