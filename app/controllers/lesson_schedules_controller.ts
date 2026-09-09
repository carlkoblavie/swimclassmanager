import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ClassAuthoringException from '#exceptions/class_authoring_exception'
import ClassLessonCapacityService from '#services/class_lesson_capacity_service'
import StageInstructorService from '#services/stage_instructor_service'
import Invitation from '#models/invitation'
import Membership from '#models/membership'
import StageInstructor from '#models/stage_instructor'
import SwimmingClass from '#models/swimming_class'
import ClassSeriesAuthoringService from '#services/class_series_authoring_service'
import InvitationTransformer from '#transformers/invitation_transformer'
import MembershipTransformer from '#transformers/membership_transformer'
import SwimmingClassTransformer from '#transformers/swimming_class_transformer'
import { generateClassLessonsValidator } from '#validators/swimming_class'
import { ClassInstructorRole } from '#values/class_instructor_role'
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
    // Instructors only see classes in stages they staff.
    if (instructorMembershipId) {
      classesQuery.whereExists((existsQuery) => {
        existsQuery
          .from('stage_instructors')
          .whereColumn('stage_instructors.level_stage_id', 'swimming_classes.level_stage_id')
          .where('stage_instructors.school_id', schoolId)
          .where('stage_instructors.membership_id', instructorMembershipId)
      })
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
        lessonsQuery
          .preload('lessonActivities', (activitiesQuery) =>
            activitiesQuery
              .preload('levelStageActivity')
              .preload('schoolActivity', (activityQuery) => activityQuery.preload('category'))
              .orderBy('position')
          )
          .orderBy('date')
      )
      .orderBy('levelStageId')
      .orderBy('name')
    const levelLessonCounts = await new ClassLessonCapacityService().countByLevel(
      schoolId,
      classes.map((swimmingClass) => swimmingClass.levelId)
    )
    const stageInstructors = await new StageInstructorService().mapForSchool(
      schoolId,
      classes.map((swimmingClass) => swimmingClass.levelStageId)
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

    // Which stages this user may generate for: instructors only their LEAD
    // stages; managers (non-instructors) get null = no per-stage restriction.
    let leadStageIds: number[] | null = null
    if (instructorMembershipId) {
      const leadRows = await StageInstructor.query()
        .where('schoolId', schoolId)
        .where('membershipId', instructorMembershipId)
        .where('role', ClassInstructorRole.LEAD)
        .select('levelStageId')
      leadStageIds = leadRows.map((row) => row.levelStageId)
    }

    return inertia.render('lessons/index', {
      classes: SwimmingClassTransformer.transform(classes, levelLessonCounts, stageInstructors),
      instructorOptions: MembershipTransformer.transform(instructorMemberships),
      pendingInstructorOptions: InvitationTransformer.transform(pendingInstructorInvitations),
      selectedClassId,
      showGenerator,
      leadStageIds,
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
    const user = auth.getUserOrFail()
    const schoolId = user.activeSchoolId!
    const payload = await request.validateUsing(generateClassLessonsValidator)

    const membership = await Membership.query()
      .where('schoolId', schoolId)
      .where('userId', user.id)
      .preload('roles')
      .first()
    const isInstructor = membership?.roles.some(
      (role) => role.name === RoleName.TEACHER || role.name === RoleName.ASSISTANT_COACH
    )

    const swimmingClass = await SwimmingClass.query()
      .where('id', payload.classId)
      .where('schoolId', schoolId)
      .whereNull('cancelledAt')
      .firstOrFail()

    // Only the LEAD instructor of a stage may generate its lessons.
    if (isInstructor && membership) {
      const isLead = await StageInstructor.query()
        .where('schoolId', schoolId)
        .where('levelStageId', swimmingClass.levelStageId)
        .where('membershipId', membership.id)
        .where('role', ClassInstructorRole.LEAD)
        .first()
      if (!isLead) {
        session.flash(
          'error',
          'Only the lead instructor for this stage can generate its lessons.'
        )
        return response.redirect().back()
      }
    }

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
