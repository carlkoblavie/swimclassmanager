import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import ClassLesson from '#models/class_lesson'
import Enrollment from '#models/enrollment'
import LessonAttendance from '#models/lesson_attendance'
import { saveAttendanceValidator } from '#validators/attendance'
import { EnrollmentStageStatus } from '#values/enrollment_stage_status'

function ageFromDateOfBirth(dateOfBirth: DateTime): number {
  const today = DateTime.now()
  let age = today.year - dateOfBirth.year
  if (today.ordinal < dateOfBirth.ordinal) {
    age -= 1
  }
  return age
}

export default class AttendanceController {
  /** Roster + marks for a lesson, as JSON for the attendance drawer. */
  async show({ auth, response, params }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const lesson = await ClassLesson.query()
      .where('id', params.id)
      .whereHas('swimmingClass', (classQuery) => classQuery.where('schoolId', schoolId))
      .preload('swimmingClass', (classQuery) =>
        classQuery.preload('level').preload('levelStage')
      )
      .firstOrFail()

    // Roster = learners whose CURRENT stage is this lesson's class's stage —
    // i.e. the learners signed up for this lesson.
    const enrollments = await Enrollment.query()
      .where('schoolId', schoolId)
      .whereHas('enrollmentStages', (stageQuery) =>
        stageQuery
          .where('levelStageId', lesson.swimmingClass.levelStageId)
          .where('status', EnrollmentStageStatus.CURRENT)
      )
      .preload('learner', (learnerQuery) => learnerQuery.preload('signup'))

    const marks = await LessonAttendance.query().where('classLessonId', lesson.id)
    const marksByLearner = new Map(marks.map((mark) => [mark.learnerId, mark.status]))

    const roster = enrollments
      .map((enrollment) => ({
        learnerId: enrollment.learnerId,
        name: `${enrollment.learner.firstName} ${enrollment.learner.lastName}`,
        initials:
          `${enrollment.learner.firstName[0] ?? ''}${enrollment.learner.lastName[0] ?? ''}`.toUpperCase(),
        age: ageFromDateOfBirth(enrollment.learner.dateOfBirth),
        guardian: enrollment.learner.signup?.contactName ?? null,
        medicalInfo: enrollment.learner.medicalInfo?.trim() || null,
        status: marksByLearner.get(enrollment.learnerId) ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    const objectives = (lesson.objectives ?? '')
      .split('\n')
      .map((goal) => goal.trim())
      .filter(Boolean)
    const startTimeRaw = lesson.startTime ?? lesson.swimmingClass.startTime
    const startTime = startTimeRaw
      ? DateTime.fromFormat(startTimeRaw, 'HH:mm').toFormat('h:mm a')
      : null

    return response.json({
      lesson: {
        id: lesson.id,
        date: lesson.date.toFormat('cccc d LLL yyyy'),
        className: lesson.swimmingClass.name,
        levelName: lesson.swimmingClass.level?.name ?? null,
        stageName: lesson.swimmingClass.levelStage?.name ?? null,
        classId: lesson.swimmingClassId,
        startTime,
        durationMinutes: lesson.durationMinutes ?? lesson.swimmingClass.durationMinutes,
        objectives,
      },
      roster,
    })
  }

  /** Save the attendance marks for a lesson (upsert per learner). */
  async save({ auth, request, response, params, session }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const lesson = await ClassLesson.query()
      .where('id', params.id)
      .whereHas('swimmingClass', (classQuery) => classQuery.where('schoolId', schoolId))
      .firstOrFail()

    const payload = await request.validateUsing(saveAttendanceValidator)

    await db.transaction(async (trx) => {
      for (const mark of payload.marks) {
        await LessonAttendance.updateOrCreate(
          { classLessonId: lesson.id, learnerId: mark.learnerId },
          { status: mark.status },
          { client: trx }
        )
      }
    })

    session.flash('success', 'Attendance saved.')
    return response.redirect().toRoute('lessons.index', {}, { qs: { classId: lesson.swimmingClassId } })
  }
}
