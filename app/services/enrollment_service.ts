import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import EnrollmentException from '#exceptions/enrollment_exception'
import Enrollment from '#models/enrollment'
import Learner from '#models/learner'
import Level from '#models/level'
import SwimYear from '#models/swim_year'
import type TermPayment from '#models/term_payment'
import type School from '#models/school'
import type SchoolLevelSetting from '#models/school_level_setting'
import type Program from '#models/program'
import type Signup from '#models/signup'
import type Term from '#models/term'
import { EnrollmentStatus } from '#values/enrollment_status'
import { PaymentStatus } from '#values/payment_status'

// How long a pending checkout holds its capacity slot before it frees up.
const RESERVATION_MINUTES = 30

type EnrollInput = {
  learnerId: number
  levelId: number
  swimYearId: number
}

export default class EnrollmentService {
  /**
   * Create a learner's pending annual enrollment into a level, holding one
   * capacity slot for the swim year, plus a pending payment per term. The
   * per-term price is frozen from the school's fee (or the level default).
   */
  async enroll(school: School, input: EnrollInput): Promise<Enrollment> {
    const level = await this.loadAvailableLevel(school, input.levelId)
    const swimYear = await this.loadSwimYear(school, input.swimYearId)
    await this.assertLearnerBelongsToSchool(school, input.learnerId)
    await this.assertNotAlreadyEnrolled(input)

    const setting = (level.$preloaded as { schoolLevelSettings?: SchoolLevelSetting[] })
      .schoolLevelSettings?.[0]
    const price = setting?.fee ?? level.defaultFee
    const terms = (swimYear.$preloaded as { terms?: Term[] }).terms ?? []

    return db.transaction(async (trx) => {
      await this.assertCapacityAvailable(level, input.swimYearId, trx)

      const enrollment = new Enrollment()
      enrollment.useTransaction(trx)
      enrollment.merge({
        schoolId: school.id,
        levelId: level.id,
        swimYearId: swimYear.id,
        learnerId: input.learnerId,
        status: EnrollmentStatus.PENDING,
        price,
        currency: 'GHS',
        reservedUntil: DateTime.now().plus({ minutes: RESERVATION_MINUTES }),
      })
      await enrollment.save()

      await enrollment.related('termPayments').createMany(
        terms.map((term) => ({
          termId: term.id,
          amount: price,
          currency: 'GHS',
          status: PaymentStatus.PENDING,
        }))
      )

      return enrollment
    })
  }

  /**
   * Mark a term payment paid (called by the Paystack webhook) and activate its
   * enrollment when it is still pending. Idempotent for an already-paid row.
   */
  async markTermPaymentSucceeded(
    payment: TermPayment,
    options: { providerReference: string }
  ): Promise<void> {
    if (payment.status === PaymentStatus.SUCCESS) {
      return
    }

    await db.transaction(async (trx) => {
      payment.useTransaction(trx)
      payment.merge({
        status: PaymentStatus.SUCCESS,
        provider: 'paystack',
        providerReference: options.providerReference,
        paidAt: DateTime.now(),
      })
      await payment.save()

      const enrollment = await Enrollment.findOrFail(payment.enrollmentId, { client: trx })
      if (enrollment.status === EnrollmentStatus.PENDING) {
        enrollment.useTransaction(trx)
        enrollment.merge({ status: EnrollmentStatus.ACTIVE, reservedUntil: null })
        await enrollment.save()
      }
    })
  }

  protected async loadAvailableLevel(school: School, levelId: number): Promise<Level> {
    const level = await Level.query()
      .where('id', levelId)
      .preload('program')
      .preload('schoolLevelSettings', (settingsQuery) => settingsQuery.where('schoolId', school.id))
      .first()

    const program = level?.$preloaded as { program?: Program } | undefined
    const setting = (
      level?.$preloaded as { schoolLevelSettings?: SchoolLevelSetting[] } | undefined
    )?.schoolLevelSettings?.[0]

    if (!level || !program?.program?.isActive || setting?.available === false) {
      throw new EnrollmentException('This level is not available.')
    }

    return level
  }

  protected async loadSwimYear(school: School, swimYearId: number): Promise<SwimYear> {
    const swimYear = await SwimYear.query()
      .where('id', swimYearId)
      .where('schoolId', school.id)
      .preload('terms', (termsQuery) => termsQuery.orderBy('position'))
      .first()

    if (!swimYear) {
      throw new EnrollmentException('Swim year not found for this school.')
    }
    if (swimYear.status === 'archived') {
      throw new EnrollmentException('This swim year has ended.')
    }

    return swimYear
  }

  protected async assertLearnerBelongsToSchool(school: School, learnerId: number): Promise<void> {
    const learner = await Learner.query().where('id', learnerId).preload('signup').first()
    const signup = learner?.$preloaded as { signup?: Signup } | undefined

    if (!learner || signup?.signup?.schoolId !== school.id) {
      throw new EnrollmentException('Learner not found for this school.')
    }
  }

  protected async assertNotAlreadyEnrolled(input: EnrollInput): Promise<void> {
    const existing = await Enrollment.query()
      .where('learnerId', input.learnerId)
      .where('levelId', input.levelId)
      .where('swimYearId', input.swimYearId)
      .where((query) => this.liveEnrollmentScope(query))
      .first()

    if (existing) {
      throw new EnrollmentException('Already enrolled for this year.')
    }
  }

  protected async assertCapacityAvailable(
    level: Level,
    swimYearId: number,
    trx: TransactionClientContract
  ): Promise<void> {
    if (level.capacity === null) {
      return
    }

    const rows = await Enrollment.query({ client: trx })
      .where('levelId', level.id)
      .where('swimYearId', swimYearId)
      .where((query) => this.liveEnrollmentScope(query))
      .forUpdate()
      .count('* as total')

    if (Number(rows[0].$extras.total) >= level.capacity) {
      throw new EnrollmentException('This level is full for the year.')
    }
  }

  // Active enrollments, plus pending ones whose reservation has not expired,
  // both hold a capacity slot.
  private liveEnrollmentScope(query: ReturnType<typeof Enrollment.query>): void {
    const now = DateTime.now().toSQL({ includeOffset: false })!
    query
      .where('status', EnrollmentStatus.ACTIVE)
      .orWhere((pending) =>
        pending.where('status', EnrollmentStatus.PENDING).where('reservedUntil', '>', now)
      )
  }
}
