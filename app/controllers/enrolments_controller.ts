import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import Enrollment from '#models/enrollment'
import Membership from '#models/membership'
import Program from '#models/program'
import School from '#models/school'
import SwimYear from '#models/swim_year'
import LearnerEnrolmentService from '#services/learner_enrolment_service'
import EnrollmentStageService from '#services/enrollment_stage_service'
import EnrollmentException from '#exceptions/enrollment_exception'
import {
  advanceStageValidator,
  assignStagesValidator,
  clearStagesValidator,
  placeLearnersValidator,
  withdrawLearnerValidator,
} from '#validators/enrolment'
import { RoleName } from '#values/role'

function ageFromDateOfBirth(dateOfBirth: DateTime): number {
  const today = DateTime.now()
  let age = today.year - dateOfBirth.year
  if (today.ordinal < dateOfBirth.ordinal) {
    age -= 1
  }
  return age
}

export default class EnrolmentsController {
  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const school = await School.findOrFail(user.activeSchoolId!)
    const swimYears = await SwimYear.query()
      .where('schoolId', school.id)
      .where('endsOn', '>=', DateTime.now().toISODate()!)
      .preload('terms', (termsQuery) => termsQuery.orderBy('position'))
      .orderBy('startsOn')
    const swimYear = swimYears.find((year) => year.status === 'current') ?? swimYears[0] ?? null
    const membership = await Membership.query()
      .where('schoolId', school.id)
      .where('userId', user.id)
      .preload('roles')
      .first()
    const isInstructor = membership?.roles.some(
      (role) => role.name === RoleName.TEACHER || role.name === RoleName.ASSISTANT_COACH
    )

    if (!swimYear) {
      return inertia.render('enrolment/index', {
        schoolName: school.name,
        swimYear: null,
        learners: [],
      })
    }

    // Every signup for this swim year, regardless of payment. Instructors see
    // only learners whose current/assigned stages they staff.
    const enrollmentsQuery = Enrollment.query()
      .where('schoolId', school.id)
      .where('swimYearId', swimYear.id)
      .preload('learner', (learnerQuery) => learnerQuery.preload('signup'))
      .preload('level', (levelQuery) =>
        levelQuery.preload('stages', (stagesQuery) => stagesQuery.orderBy('position'))
      )
      .preload('enrollmentStages', (stageQuery) =>
        stageQuery.preload('levelStage', (ls) => ls.preload('level')).orderBy('position')
      )
      .orderBy('id')

    if (isInstructor && membership) {
      enrollmentsQuery.whereHas('enrollmentStages', (stageQuery) => {
        stageQuery.whereExists((existsQuery) => {
          existsQuery
            .from('stage_instructors')
            .whereColumn('stage_instructors.level_stage_id', 'enrollment_stages.level_stage_id')
            .where('stage_instructors.school_id', school.id)
            .where('stage_instructors.membership_id', membership.id)
        })
      })
    }

    // The school's curriculum catalog for the Program → Level → Stage picker.
    const programs = await Program.query()
      .withScopes((scopes) => scopes.active())
      .preload('levels', (levelQuery) =>
        levelQuery
          .preload('schoolLevelSettings', (settingsQuery) =>
            settingsQuery.where('schoolId', school.id)
          )
          .preload('stages', (stagesQuery) => stagesQuery.orderBy('position'))
          .orderBy('id')
      )
      .orderBy('name')

    const enrollments = await enrollmentsQuery

    return inertia.render('enrolment/index', {
      schoolName: school.name,
      swimYear: { id: swimYear.id, name: swimYear.name },
      catalog: programs.map((program) => ({
        id: program.id,
        name: program.name,
        levels: program.levels
          .filter((level) => (level.schoolLevelSettings?.[0]?.available ?? true) !== false)
          .map((level) => ({
            id: level.id,
            name: level.name,
            stages: (level.stages ?? []).map((stage) => ({
              id: stage.id,
              name: stage.name,
              position: stage.position,
            })),
          })),
      })),
      learners: enrollments.map((enrollment) => ({
        id: enrollment.learnerId,
        enrollmentId: enrollment.id,
        name: `${enrollment.learner.firstName} ${enrollment.learner.lastName}`,
        initials:
          `${enrollment.learner.firstName[0] ?? ''}${enrollment.learner.lastName[0] ?? ''}`.toUpperCase(),
        age: ageFromDateOfBirth(enrollment.learner.dateOfBirth),
        guardianName: enrollment.learner.signup?.contactName ?? 'Adult learner',
        // The level the learner signed up for.
        signupLevel: { id: enrollment.levelId, name: enrollment.level.name },
        stages: enrollment.enrollmentStages.map((stage) => ({
          levelStageId: stage.levelStageId,
          name: stage.levelStage?.name ?? 'Stage',
          levelId: stage.levelStage?.levelId ?? null,
          levelName: stage.levelStage?.level?.name ?? null,
          position: stage.position,
          status: stage.status,
        })),
      })),
    })
  }

  @inject()
  async place(
    { auth, request, response, session }: HttpContext,
    enrolment: LearnerEnrolmentService
  ) {
    const user = auth.getUserOrFail()
    const school = await School.findOrFail(user.activeSchoolId!)
    const payload = await request.validateUsing(placeLearnersValidator)
    const count = await enrolment.placeLearners(school, payload)

    session.flash('success', `${count} ${count === 1 ? 'learner' : 'learners'} placed in class.`)
    return response.redirect().toRoute('enrolment.index')
  }

  @inject()
  async withdraw(
    { auth, request, response, session }: HttpContext,
    enrolment: LearnerEnrolmentService
  ) {
    const user = auth.getUserOrFail()
    const school = await School.findOrFail(user.activeSchoolId!)
    const payload = await request.validateUsing(withdrawLearnerValidator)
    await enrolment.withdrawFromClass(school, payload)

    session.flash('success', 'Learner withdrawn from class.')
    return response.redirect().toRoute('enrolment.index')
  }

  /** Assign a learner's enrollment to one or more stages of their level. */
  @inject()
  async assignStages(
    { auth, request, response, session }: HttpContext,
    stages: EnrollmentStageService
  ) {
    const user = auth.getUserOrFail()
    const school = await School.findOrFail(user.activeSchoolId!)
    const payload = await request.validateUsing(assignStagesValidator)

    try {
      await stages.assignStages(school, payload)
      session.flash('success', 'Stages assigned.')
    } catch (error) {
      if (error instanceof EnrollmentException) {
        session.flash('error', error.message)
        return response.redirect().back()
      }
      throw error
    }
    return response.redirect().toRoute('enrolment.index')
  }

  /** Remove all of a learner's stage assignments (undo). */
  @inject()
  async removeStages(
    { auth, request, response, session }: HttpContext,
    stages: EnrollmentStageService
  ) {
    const user = auth.getUserOrFail()
    const school = await School.findOrFail(user.activeSchoolId!)
    const payload = await request.validateUsing(clearStagesValidator)

    try {
      await stages.clearStages(school, payload.enrollmentId)
      session.flash('success', 'Stage assignment removed.')
    } catch (error) {
      if (error instanceof EnrollmentException) {
        session.flash('error', error.message)
        return response.redirect().back()
      }
      throw error
    }
    return response.redirect().toRoute('enrolment.index')
  }

  /** Mark the learner's current stage complete and advance to the next. */
  @inject()
  async advanceStage(
    { auth, request, response, session }: HttpContext,
    stages: EnrollmentStageService
  ) {
    const user = auth.getUserOrFail()
    const school = await School.findOrFail(user.activeSchoolId!)
    const payload = await request.validateUsing(advanceStageValidator)

    try {
      await stages.advanceStage(school, payload)
      session.flash('success', 'Stage completed.')
    } catch (error) {
      if (error instanceof EnrollmentException) {
        session.flash('error', error.message)
        return response.redirect().back()
      }
      throw error
    }
    return response.redirect().back()
  }
}
