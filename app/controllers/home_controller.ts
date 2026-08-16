import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import ClassLesson from '#models/class_lesson'
import Enrollment from '#models/enrollment'
import Invitation from '#models/invitation'
import Membership from '#models/membership'
import Signup from '#models/signup'
import SwimYear from '#models/swim_year'
import SwimmingClass from '#models/swimming_class'
import TermPayment from '#models/term_payment'
import { ClassInstructorRole } from '#values/class_instructor_role'
import { EnrollmentStatus } from '#values/enrollment_status'
import { RoleName } from '#values/role'

function formatTime(value: string | null): string {
  if (!value) {
    return 'Time to be confirmed'
  }

  const [rawHour, rawMinute] = value.split(':').map(Number)
  if (!Number.isFinite(rawHour) || !Number.isFinite(rawMinute)) {
    return value
  }

  const hour = rawHour % 12 || 12
  const period = rawHour >= 12 ? 'pm' : 'am'
  return `${hour}:${String(rawMinute).padStart(2, '0')} ${period}`
}

function lessonLabel(lesson: ClassLesson): string {
  const swimmingClass = lesson.swimmingClass
  const level = swimmingClass.level?.name
  const stage = swimmingClass.levelStage?.name
  return [swimmingClass.name, level, stage].filter(Boolean).join(' · ')
}

function instructorName(lesson: ClassLesson): string | null {
  const lead = lesson.lessonInstructors.find(
    (instructor) => instructor.role === ClassInstructorRole.LEAD
  )
  const membershipName = lead?.membership?.user?.fullName
  const inviteeName = lead?.invitation?.inviteeFullName
  return membershipName ?? inviteeName ?? null
}

function serializeLesson(lesson: ClassLesson) {
  const swimmingClass = lesson.swimmingClass
  const date = lesson.date.toISODate() ?? ''
  return {
    id: lesson.id,
    classId: swimmingClass.id,
    label: lessonLabel(lesson),
    date,
    dateLabel: lesson.date.toFormat('ccc d LLL'),
    time: formatTime(swimmingClass.startTime),
    durationMinutes: lesson.durationMinutes ?? swimmingClass.durationMinutes,
    instructor: instructorName(lesson),
    hasActivities: lesson.lessonActivities.length > 0,
    href: `/classes/${swimmingClass.id}?lessonId=${lesson.id}`,
  }
}

function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default class HomeController {
  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const schoolId = user.activeSchoolId!
    const now = DateTime.now().setZone('Africa/Accra')
    const today = now.startOf('day')

    const [membership, swimYears] = await Promise.all([
      Membership.query()
        .where('schoolId', schoolId)
        .where('userId', user.id)
        .preload('roles')
        .first(),
      SwimYear.query().where('schoolId', schoolId).preload('terms').orderBy('startsOn', 'desc'),
    ])

    const swimYear =
      swimYears.find((year) => year.status === 'current') ??
      swimYears.find((year) => year.status === 'upcoming') ??
      swimYears[0]
    const orderedTerms = swimYear?.terms.toSorted((a, b) => a.position - b.position) ?? []
    const term =
      orderedTerms.find((candidate) => today >= candidate.startsOn && today <= candidate.endsOn) ??
      orderedTerms.find((candidate) => candidate.startsOn > today) ??
      orderedTerms[0]
    const roles = membership?.roles.map((role) => role.name) ?? []
    const isInstructor = roles.some(
      (role) => role === RoleName.TEACHER || role === RoleName.ASSISTANT_COACH
    )
    const isManager = roles.some(
      (role) => role === RoleName.ADMINISTRATOR || role === RoleName.HEAD_COACH
    )

    const emptyDashboard = {
      mode: isInstructor ? ('instructor' as const) : ('management' as const),
      term: null,
      greeting: `${greetingFor(now.hour)}, ${user.fullName ?? user.email}`,
      metrics: {
        first: { label: isInstructor ? 'My lessons' : 'Sign-ups', value: 0, detail: 'None yet' },
        second: { label: isInstructor ? 'My learners' : 'Enrolled', value: 0, detail: 'None yet' },
        third: { label: isInstructor ? 'To prepare' : 'Lessons', value: 0, detail: 'None yet' },
        fourth: {
          label: isInstructor ? 'My classes' : 'Instructors',
          value: 0,
          detail: 'None yet',
        },
      },
      today: { dateLabel: today.toFormat('cccc d LLLL'), lessons: [] },
      upcoming: [],
      needsYou: [],
      revenue: null,
    }

    if (!term || !swimYear) {
      return inertia.render('home', { dashboard: emptyDashboard })
    }

    const [classes, lessons, enrollments] = await Promise.all([
      SwimmingClass.query()
        .where('schoolId', schoolId)
        .where('termId', term.id)
        .whereNull('cancelledAt')
        .preload('level')
        .preload('levelStage')
        .orderBy('startTime')
        .orderBy('name'),
      ClassLesson.query()
        .whereHas('swimmingClass', (classQuery) =>
          classQuery.where('schoolId', schoolId).where('termId', term.id).whereNull('cancelledAt')
        )
        .if(isInstructor, (query) =>
          query.whereHas('lessonInstructors', (instructorsQuery) =>
            instructorsQuery.where('membershipId', membership!.id)
          )
        )
        .where('date', '>=', today.toISODate()!)
        .preload('swimmingClass', (classQuery) => classQuery.preload('level').preload('levelStage'))
        .preload('lessonActivities')
        .preload('lessonInstructors', (instructorsQuery) =>
          instructorsQuery
            .preload('membership', (membershipQuery) => membershipQuery.preload('user'))
            .preload('invitation')
        )
        .orderBy('date'),
      Enrollment.query()
        .where('schoolId', schoolId)
        .where('swimYearId', swimYear.id)
        .where('termId', term.id)
        .where('status', EnrollmentStatus.ACTIVE)
        .preload('termPayments'),
    ])

    const visibleClassIds = new Set(lessons.map((lesson) => lesson.swimmingClassId))
    const visibleEnrollments = isInstructor
      ? enrollments.filter((enrollment) => visibleClassIds.has(enrollment.swimmingClassId ?? 0))
      : enrollments
    const serializedLessons = lessons.map(serializeLesson)
    const todayLessons = serializedLessons.filter((lesson) => lesson.date === today.toISODate())
    const upcomingLessons = serializedLessons.filter((lesson) => lesson.date !== today.toISODate())

    const instructorCount = await Membership.query()
      .where('schoolId', schoolId)
      .whereHas('roles', (rolesQuery) =>
        rolesQuery.whereIn('name', [
          RoleName.TEACHER,
          RoleName.ASSISTANT_COACH,
          RoleName.HEAD_COACH,
        ])
      )
      .count('* as total')

    if (isInstructor || !isManager) {
      const classIds = new Set(visibleEnrollments.map((enrollment) => enrollment.swimmingClassId))
      const classesTaught = classes.filter((swimmingClass) => classIds.has(swimmingClass.id))
      const lessonsNeedingActivities = lessons.filter(
        (lesson) => lesson.lessonActivities.length === 0
      ).length

      return inertia.render('home', {
        dashboard: {
          mode: 'instructor',
          term: { yearName: swimYear.name, termName: term.name },
          greeting: `${greetingFor(now.hour)}, ${user.fullName ?? user.email}`,
          metrics: {
            first: {
              label: 'My lessons',
              value: lessons.length,
              detail: `${term.name} · upcoming`,
            },
            second: {
              label: 'My learners',
              value: new Set(visibleEnrollments.map((enrollment) => enrollment.learnerId)).size,
              detail: 'in assigned classes',
            },
            third: {
              label: 'To prepare',
              value: lessonsNeedingActivities,
              detail: 'lessons without activities',
            },
            fourth: {
              label: 'My classes',
              value: classesTaught.length,
              detail: 'assigned this term',
            },
          },
          today: { dateLabel: today.toFormat('cccc d LLLL'), lessons: todayLessons },
          upcoming: upcomingLessons.slice(0, 5),
          needsYou: lessonsNeedingActivities
            ? [
                {
                  label: 'Lessons need activities',
                  detail: `${lessonsNeedingActivities} assigned lesson${lessonsNeedingActivities === 1 ? '' : 's'} to prepare`,
                  tone: 'amber',
                },
              ]
            : [],
          revenue: null,
        },
      })
    }

    const [signups, pendingInvitations, payments] = await Promise.all([
      Signup.query()
        .where('schoolId', schoolId)
        .whereNull('closedAt')
        .preload('learners', (learnersQuery) =>
          learnersQuery.preload('enrollments', (enrollmentQuery) =>
            enrollmentQuery.where('swimYearId', swimYear.id).where('termId', term.id)
          )
        ),
      Invitation.query()
        .where('schoolId', schoolId)
        .whereNull('acceptedAt')
        .whereHas('role', (roleQuery) =>
          roleQuery.whereIn('name', [
            RoleName.TEACHER,
            RoleName.ASSISTANT_COACH,
            RoleName.HEAD_COACH,
          ])
        )
        .count('* as total'),
      TermPayment.query().where('termId', term.id).orderBy('createdAt'),
    ])

    const awaitingClass = signups.filter((signup) =>
      signup.learners.some((learner) =>
        learner.enrollments.some((enrollment) => enrollment.swimmingClassId === null)
      )
    ).length
    const unstaffedLessons = lessons.filter(
      (lesson) => lesson.lessonInstructors.length === 0
    ).length
    const collected = payments.reduce((total, payment) => total + Number(payment.amountPaid), 0)
    const invoiced = payments.reduce((total, payment) => total + Number(payment.amount), 0)
    const outstanding = Math.max(invoiced - collected, 0)
    const overdueCutoff = today.minus({ days: 30 })
    const overdue = payments
      .filter((payment) => payment.createdAt <= overdueCutoff)
      .reduce(
        (total, payment) =>
          total + Math.max(Number(payment.amount) - Number(payment.amountPaid), 0),
        0
      )

    const revenue = Array.from({ length: 6 }, (_, index) => {
      const month = today.minus({ months: 5 - index }).startOf('month')
      const monthPayments = payments.filter(
        (payment) =>
          payment.createdAt.year === month.year && payment.createdAt.month === month.month
      )
      return {
        label: month.toFormat('LLL'),
        collected: monthPayments.reduce((total, payment) => total + Number(payment.amountPaid), 0),
        invoiced: monthPayments.reduce((total, payment) => total + Number(payment.amount), 0),
      }
    })

    return inertia.render('home', {
      dashboard: {
        mode: 'management',
        term: { yearName: swimYear.name, termName: term.name },
        greeting: `${greetingFor(now.hour)}, ${user.fullName ?? user.email}`,
        metrics: {
          first: {
            label: 'Sign-ups',
            value: signups.length,
            detail: `${awaitingClass} awaiting a class`,
          },
          second: {
            label: 'Enrolled',
            value: enrollments.length,
            detail: `across ${new Set(enrollments.map((enrollment) => enrollment.swimmingClassId)).size} classes`,
          },
          third: {
            label: 'Lessons',
            value: lessons.length,
            detail: `${unstaffedLessons} unstaffed`,
          },
          fourth: {
            label: 'Instructors',
            value: Number(instructorCount[0].$extras.total),
            detail: `${Number(pendingInvitations[0].$extras.total)} invite pending`,
          },
        },
        today: { dateLabel: today.toFormat('cccc d LLLL'), lessons: todayLessons },
        upcoming: upcomingLessons.slice(0, 5),
        needsYou: [
          ...(overdue > 0
            ? [
                {
                  label: 'Invoices overdue',
                  detail: `GHS ${overdue.toLocaleString()} outstanding`,
                  tone: 'red',
                },
              ]
            : []),
          ...(awaitingClass > 0
            ? [{ label: 'Sign-ups awaiting a class', detail: 'Paid, not yet placed', tone: 'blue' }]
            : []),
          ...(unstaffedLessons > 0
            ? [
                {
                  label: 'Lessons without an instructor',
                  detail: 'Next lessons in this term',
                  tone: 'amber',
                },
              ]
            : []),
        ],
        revenue: {
          currency: payments[0]?.currency ?? 'GHS',
          collected,
          outstanding,
          overdue,
          months: revenue,
        },
      },
    })
  }
}
