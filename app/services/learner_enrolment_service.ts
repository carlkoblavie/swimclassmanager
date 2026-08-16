import db from '@adonisjs/lucid/services/db'
import EnrollmentException from '#exceptions/enrollment_exception'
import Enrollment from '#models/enrollment'
import ClassLesson from '#models/class_lesson'
import SwimmingClass from '#models/swimming_class'
import type School from '#models/school'
import { EnrollmentStatus } from '#values/enrollment_status'
import { PaymentStatus } from '#values/payment_status'
import type { Infer } from '@vinejs/vine/types'
import type { placeLearnersValidator, withdrawLearnerValidator } from '#validators/enrolment'

type PlaceLearnersInput = Infer<typeof placeLearnersValidator>
type WithdrawLearnerInput = Infer<typeof withdrawLearnerValidator>

export default class LearnerEnrolmentService {
  async placeLearners(school: School, input: PlaceLearnersInput): Promise<number> {
    return db.transaction(async (trx) => {
      const swimmingClass = await SwimmingClass.query({ client: trx })
        .where('id', input.swimmingClassId)
        .where('schoolId', school.id)
        .whereNull('cancelledAt')
        .preload('level')
        .preload('term')
        .first()

      if (!swimmingClass || !swimmingClass.term || !swimmingClass.termId) {
        throw new EnrollmentException('Choose an active class with a swim year.')
      }
      const termId = swimmingClass.termId

      const enrollments = await Enrollment.query({ client: trx })
        .where('schoolId', school.id)
        .where('swimYearId', swimmingClass.term.swimYearId)
        .where('termId', termId)
        .whereIn('learnerId', input.learnerIds)
        .where((enrollmentQuery) =>
          enrollmentQuery
            .where('status', EnrollmentStatus.ACTIVE)
            .orWhereHas('termPayments', (paymentQuery) =>
              paymentQuery
                .where('termId', termId)
                .where((termPaymentQuery) =>
                  termPaymentQuery
                    .where('status', PaymentStatus.PARTIAL)
                    .orWhere((amountQuery) =>
                      amountQuery
                        .where('amountPaid', '>', 0)
                        .whereColumn('amountPaid', '<', 'amount')
                    )
                )
            )
        )
        .forUpdate()

      if (enrollments.length !== input.learnerIds.length) {
        throw new EnrollmentException('Select only paid or part-paid learners awaiting placement.')
      }

      const occupied = await Enrollment.query({ client: trx })
        .where('schoolId', school.id)
        .where('swimYearId', swimmingClass.term.swimYearId)
        .where('termId', swimmingClass.termId)
        .where('swimmingClassId', swimmingClass.id)
        .where('status', EnrollmentStatus.ACTIVE)
        .whereNotIn(
          'id',
          enrollments.map((enrollment) => enrollment.id)
        )
        .count('* as total')
      const occupiedCount = Number(occupied[0].$extras.total)
      const capacity = swimmingClass.level?.capacity

      if (
        capacity !== null &&
        capacity !== undefined &&
        occupiedCount + enrollments.length > capacity
      ) {
        throw new EnrollmentException('There are not enough places in this class.')
      }

      if (
        input.startDate < swimmingClass.term.startsOn ||
        input.startDate > swimmingClass.term.endsOn
      ) {
        throw new EnrollmentException('The start date must be within the class term.')
      }

      const availableLessons = await ClassLesson.query({ client: trx })
        .where('swimmingClassId', swimmingClass.id)
        .where('date', '>=', input.startDate.toISODate()!)
        .orderBy('date')
      const selectedLessonIds = input.lessonIds ?? availableLessons.map((lesson) => lesson.id)
      const selectedLessonIdSet = new Set(selectedLessonIds)
      const lessons = availableLessons.filter((lesson) => selectedLessonIdSet.has(lesson.id))

      if (lessons.length !== selectedLessonIds.length) {
        throw new EnrollmentException(
          'Choose lessons from the selected class after the start date.'
        )
      }

      for (const enrollment of enrollments) {
        enrollment.useTransaction(trx)
        enrollment.merge({
          swimmingClassId: swimmingClass.id,
          termId: swimmingClass.termId,
          startDate: input.startDate,
        })
        await enrollment.save()
        await enrollment.related('lessons').sync(selectedLessonIds)
      }

      return enrollments.length
    })
  }

  async withdrawFromClass(school: School, input: WithdrawLearnerInput): Promise<void> {
    await db.transaction(async (trx) => {
      const enrollment = await Enrollment.query({ client: trx })
        .where('id', input.enrollmentId)
        .where('schoolId', school.id)
        .where('status', EnrollmentStatus.ACTIVE)
        .forUpdate()
        .first()

      if (!enrollment) {
        throw new EnrollmentException('This learner is no longer enrolled in an active term.')
      }

      enrollment.useTransaction(trx)
      enrollment.merge({ swimmingClassId: null, startDate: null })
      await enrollment.save()
      await enrollment.related('lessons').sync([])
    })
  }
}
