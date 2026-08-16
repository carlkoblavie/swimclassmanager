import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import Enrollment from '#models/enrollment'
import Membership from '#models/membership'
import School from '#models/school'
import SwimYear from '#models/swim_year'
import SwimmingClass from '#models/swimming_class'
import LearnerEnrolmentService from '#services/learner_enrolment_service'
import { placeLearnersValidator, withdrawLearnerValidator } from '#validators/enrolment'
import { EnrollmentStatus } from '#values/enrollment_status'
import { PaymentStatus } from '#values/payment_status'
import { RoleName } from '#values/role'

const WEEKDAY_NAMES: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
}

function formatTime(value: string | null): string | null {
  if (!value) {
    return null
  }

  const parsed = DateTime.fromFormat(value, 'HH:mm')
  return parsed.isValid ? parsed.toFormat('h:mm a') : value
}

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
    const term = swimYear?.terms[0] ?? null
    const membership = await Membership.query()
      .where('schoolId', school.id)
      .where('userId', user.id)
      .preload('roles')
      .first()
    const isInstructor = membership?.roles.some(
      (role) => role.name === RoleName.TEACHER || role.name === RoleName.ASSISTANT_COACH
    )

    if (!swimYear || !term) {
      return inertia.render('enrolment/index', {
        schoolName: school.name,
        swimYear: null,
        learners: [],
        classes: [],
      })
    }

    const enrollmentsQuery = Enrollment.query()
      .where('schoolId', school.id)
      .where('swimYearId', swimYear.id)
      .where('termId', term.id)
      .where((enrollmentQuery) =>
        enrollmentQuery
          .where('status', EnrollmentStatus.ACTIVE)
          .orWhereHas('termPayments', (paymentQuery) =>
            paymentQuery.where('termId', term.id).where('status', PaymentStatus.PARTIAL)
          )
      )
      .preload('learner', (learnerQuery) => learnerQuery.preload('signup'))
      .preload('level')
      .preload('termPayments', (paymentQuery) => paymentQuery.where('termId', term.id))
      .preload('lessons', (lessonQuery) => lessonQuery.orderBy('date'))
      .preload('swimmingClass', (classQuery) =>
        classQuery
          .preload('level', (levelQuery) => levelQuery.preload('program'))
          .preload('levelStage')
      )
      .orderBy('id')

    if (isInstructor && membership) {
      enrollmentsQuery.whereHas('swimmingClass', (classQuery) => {
        classQuery.where((assignedClassQuery) => {
          assignedClassQuery
            .whereHas('classInstructors', (instructorsQuery) =>
              instructorsQuery.where('membershipId', membership.id)
            )
            .orWhereHas('lessons', (lessonsQuery) =>
              lessonsQuery.whereHas('lessonInstructors', (instructorsQuery) =>
                instructorsQuery.where('membershipId', membership.id)
              )
            )
        })
      })
    }

    const [enrollments, classes] = await Promise.all([
      enrollmentsQuery,
      SwimmingClass.query()
        .where('schoolId', school.id)
        .whereNull('cancelledAt')
        .where('termId', term.id)
        .preload('level', (levelQuery) => levelQuery.preload('program'))
        .preload('levelStage')
        .preload('term')
        .preload('lessons', (lessonQuery) =>
          lessonQuery
            .where('date', '>=', term.startsOn.toISODate()!)
            .where('date', '<=', term.endsOn.toISODate()!)
            .orderBy('date')
        )
        .orderBy('name'),
    ])

    const placementsByClass = new Map<number, number>()
    for (const enrollment of enrollments) {
      if (enrollment.swimmingClassId) {
        placementsByClass.set(
          enrollment.swimmingClassId,
          (placementsByClass.get(enrollment.swimmingClassId) ?? 0) + 1
        )
      }
    }

    return inertia.render('enrolment/index', {
      schoolName: school.name,
      swimYear: {
        id: swimYear.id,
        name: swimYear.name,
        termName: term.name,
        termStartDate: term.startsOn.toISODate() ?? '',
      },
      learners: enrollments.map((enrollment) => ({
        id: enrollment.learnerId,
        enrollmentId: enrollment.id,
        name: `${enrollment.learner.firstName} ${enrollment.learner.lastName}`,
        initials:
          `${enrollment.learner.firstName[0] ?? ''}${enrollment.learner.lastName[0] ?? ''}`.toUpperCase(),
        age: ageFromDateOfBirth(enrollment.learner.dateOfBirth),
        guardianName: enrollment.learner.signup?.contactName ?? 'Adult learner',
        paymentStatus: enrollment.termPayments.some(
          (payment) =>
            payment.status === PaymentStatus.PARTIAL ||
            (payment.amountPaid > 0 && payment.amountPaid < payment.amount)
        )
          ? 'part_paid'
          : 'paid',
        level: { id: enrollment.levelId, name: enrollment.level.name },
        startDate: enrollment.startDate?.toISODate() ?? null,
        startDateLabel: enrollment.startDate?.toFormat('ccc d LLL') ?? null,
        lessonIds: enrollment.lessons.map((lesson) => lesson.id),
        class: enrollment.swimmingClass
          ? {
              id: enrollment.swimmingClass.id,
              name: enrollment.swimmingClass.name,
              levelName: enrollment.swimmingClass.level?.name ?? 'Class',
              stageName: enrollment.swimmingClass.levelStage?.name ?? 'Stage not set',
            }
          : null,
      })),
      classes: classes.map((swimmingClass) => {
        const enrolledCount = placementsByClass.get(swimmingClass.id) ?? 0
        const capacity = swimmingClass.level?.capacity ?? null
        return {
          id: swimmingClass.id,
          name: swimmingClass.name,
          levelId: swimmingClass.levelId,
          levelName: swimmingClass.level?.name ?? 'Level not set',
          stageName: swimmingClass.levelStage?.name ?? 'Stage not set',
          programName: swimmingClass.level?.program?.name ?? '',
          weekday: swimmingClass.weekday ? WEEKDAY_NAMES[swimmingClass.weekday] : null,
          startTime: formatTime(swimmingClass.startTime),
          durationMinutes: swimmingClass.durationMinutes,
          capacity,
          enrolledCount,
          placesLeft: capacity === null ? null : Math.max(capacity - enrolledCount, 0),
          lessons: swimmingClass.lessons.map((lesson) => ({
            id: lesson.id,
            date: lesson.date.toISODate() ?? '',
            label: lesson.date.toFormat('ccc d LLL'),
          })),
        }
      }),
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
}
