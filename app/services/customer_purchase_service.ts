import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import env from '#start/env'
import { appUrl } from '#config/app'
import CustomerPurchaseException from '#exceptions/customer_purchase_exception'
import Enrollment from '#models/enrollment'
import Level from '#models/level'
import PaymentTransaction from '#models/payment_transaction'
import Purchase from '#models/purchase'
import Signup from '#models/signup'
import SwimYear from '#models/swim_year'
import TermPayment from '#models/term_payment'
import PaystackClient from '#services/paystack_client'
import { EnrollmentStatus } from '#values/enrollment_status'
import { PaymentStatus } from '#values/payment_status'
import { PurchaseStatus } from '#values/purchase_status'
import type School from '#models/school'
import type Program from '#models/program'
import type SchoolLevelSetting from '#models/school_level_setting'
import type Term from '#models/term'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { Infer } from '@vinejs/vine/types'
import type { initializeCustomerPurchaseValidator } from '#validators/customer_purchase'

const RESERVATION_MINUTES = 30
const BILLABLE_TERMS_COUNT = 1

type CheckoutInput = Infer<typeof initializeCustomerPurchaseValidator>

@inject()
export default class CustomerPurchaseService {
  constructor(protected paystack: PaystackClient) {}

  async captureInquiry(school: School, input: CheckoutInput): Promise<Signup> {
    return Signup.create({
      schoolId: school.id,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      whatsapp: input.whatsapp,
      registrantRole: input.registrantRole ?? null,
      message: input.message ?? null,
    })
  }

  async captureRegistration(school: School, input: CheckoutInput): Promise<Signup> {
    const learnerInputs = input.learners ?? []
    if (learnerInputs.length === 0) {
      throw new CustomerPurchaseException('Add at least one learner to continue.')
    }

    const swimYear = await this.loadSwimYear(school)
    const terms = (swimYear.$preloaded as { terms?: Term[] }).terms ?? []
    if (terms.length === 0) {
      throw new CustomerPurchaseException('No terms are set up for this swim year.')
    }
    const billableTerms = terms.slice(0, BILLABLE_TERMS_COUNT)

    const levels = await this.loadLevels(
      school,
      learnerInputs.map((learner) => learner.levelPublicId)
    )

    // A registration is a manual-invoice purchase: it is created PENDING (no
    // Paystack transaction) so it enters the invoice pipeline and the school can
    // mark it invoice-sent, then paid, from the sign-ups screen.
    const signup = await db.transaction(async (trx) => {
      const created = await Signup.create(
        {
          schoolId: school.id,
          contactName: input.contactName,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          whatsapp: input.whatsapp,
          registrantRole: input.registrantRole ?? null,
          message: input.message ?? null,
        },
        { client: trx }
      )

      const purchase = await Purchase.create(
        {
          schoolId: school.id,
          signupId: created.id,
          swimYearId: swimYear.id,
          status: PurchaseStatus.PENDING,
          totalAmount: 0,
          currency: 'GHS',
        },
        { client: trx }
      )

      let totalAmount = 0

      for (const learnerInput of learnerInputs) {
        const level = levels.get(learnerInput.levelPublicId)
        if (!level) {
          throw new CustomerPurchaseException('One or more selected levels are not available.')
        }

        const price = this.effectiveLevelFee(level)
        const itemAmount = price * billableTerms.length
        totalAmount += itemAmount

        await this.assertCapacityAvailable(level, swimYear.id, trx)

        const { levelPublicId: _levelPublicId, ...learnerData } = learnerInput
        const learner = await created.related('learners').create(learnerData)
        learner.useTransaction(trx)

        const enrollment = await Enrollment.create(
          {
            schoolId: school.id,
            levelId: level.id,
            swimYearId: swimYear.id,
            learnerId: learner.id,
            termId: billableTerms[0]?.id ?? null,
            status: EnrollmentStatus.PENDING,
            price,
            currency: 'GHS',
            reservedUntil: null,
          },
          { client: trx }
        )

        await enrollment.related('termPayments').createMany(
          billableTerms.map((term) => ({
            termId: term.id,
            amount: price,
            currency: 'GHS',
            status: PaymentStatus.PENDING,
          }))
        )

        await purchase.related('items').create({
          enrollmentId: enrollment.id,
          learnerId: learner.id,
          levelId: level.id,
          levelPublicId: level.publicId!,
          levelName: level.name,
          amount: itemAmount,
          currency: 'GHS',
        })
      }

      purchase.useTransaction(trx)
      purchase.merge({ totalAmount })
      await purchase.save()

      return created
    })

    await signup.load('learners')
    return signup
  }

  async initialize(
    school: School,
    input: CheckoutInput,
    context: { organisationSlug: string; schoolSlug: string }
  ) {
    const learnerInputs = input.learners ?? []
    if (learnerInputs.length === 0) {
      throw new CustomerPurchaseException('Add at least one learner to continue.')
    }

    const swimYear = await this.loadSwimYear(school)
    const terms = (swimYear.$preloaded as { terms?: Term[] }).terms ?? []
    if (terms.length === 0) {
      throw new CustomerPurchaseException('No terms are set up for this swim year.')
    }
    const billableTerms = terms.slice(0, BILLABLE_TERMS_COUNT)

    const levels = await this.loadLevels(
      school,
      learnerInputs.map((learner) => learner.levelPublicId)
    )
    const reference = this.makeReference()

    const checkout = await db.transaction(async (trx) => {
      const signup = await Signup.create(
        {
          schoolId: school.id,
          contactName: input.contactName,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          whatsapp: input.whatsapp ?? null,
          registrantRole: input.registrantRole ?? null,
          message: input.message ?? null,
        },
        { client: trx }
      )

      const purchase = await Purchase.create(
        {
          schoolId: school.id,
          signupId: signup.id,
          swimYearId: swimYear.id,
          status: PurchaseStatus.PENDING,
          totalAmount: 0,
          currency: 'GHS',
        },
        { client: trx }
      )

      let totalAmount = 0
      const purchasedLevels: Array<{ publicId: string; name: string }> = []

      for (const learnerInput of learnerInputs) {
        const level = levels.get(learnerInput.levelPublicId)
        if (!level) {
          throw new CustomerPurchaseException('One or more selected levels are not available.')
        }

        const price = this.effectiveLevelFee(level)
        const itemAmount = price * billableTerms.length
        totalAmount += itemAmount
        purchasedLevels.push({ publicId: level.publicId!, name: level.name })

        await this.assertCapacityAvailable(level, swimYear.id, trx)

        const { levelPublicId: _levelPublicId, ...learnerData } = learnerInput
        const learner = await signup.related('learners').create(learnerData)
        learner.useTransaction(trx)

        const enrollment = await Enrollment.create(
          {
            schoolId: school.id,
            levelId: level.id,
            swimYearId: swimYear.id,
            learnerId: learner.id,
            termId: billableTerms[0]?.id ?? null,
            status: EnrollmentStatus.PENDING,
            price,
            currency: 'GHS',
            reservedUntil: DateTime.now().plus({ minutes: RESERVATION_MINUTES }),
          },
          { client: trx }
        )

        await enrollment.related('termPayments').createMany(
          billableTerms.map((term) => ({
            termId: term.id,
            amount: price,
            currency: 'GHS',
            status: PaymentStatus.PENDING,
          }))
        )

        await purchase.related('items').create({
          enrollmentId: enrollment.id,
          learnerId: learner.id,
          levelId: level.id,
          levelPublicId: level.publicId!,
          levelName: level.name,
          amount: itemAmount,
          currency: 'GHS',
        })
      }

      purchase.merge({ totalAmount })
      await purchase.save()

      const transaction = await purchase.related('transactions').create({
        provider: 'paystack',
        providerReference: reference,
        status: PaymentStatus.PENDING,
        amount: totalAmount,
        currency: 'GHS',
      })

      return { purchase, transaction, purchasedLevels }
    })

    try {
      const initialized = await this.paystack.initialize({
        email: input.contactEmail,
        amount: checkout.purchase.totalAmount,
        currency: checkout.purchase.currency,
        reference,
        callbackUrl: this.callbackUrl(reference, context),
        metadata: {
          purchasePublicId: checkout.purchase.publicId,
          schoolSlug: context.schoolSlug,
          organisationSlug: context.organisationSlug,
          levelPublicIds: checkout.purchasedLevels.map((level) => level.publicId),
        },
      })

      checkout.transaction.merge({
        accessCode: initialized.accessCode,
        authorizationUrl: initialized.authorizationUrl,
        providerPayload: JSON.stringify(initialized.raw),
      })
      await checkout.transaction.save()

      return {
        purchase: checkout.purchase,
        transaction: checkout.transaction,
        authorizationUrl: initialized.authorizationUrl,
        accessCode: initialized.accessCode,
        reference: initialized.reference,
      }
    } catch (error) {
      await this.markInitializationFailed(checkout.transaction)
      throw error
    }
  }

  async verify(reference: string) {
    const verified = await this.paystack.verify(reference)
    return this.settle(reference, {
      status: verified.status,
      amount: verified.amount,
      currency: verified.currency,
      paidAt: verified.paidAt,
      raw: verified.raw,
    })
  }

  async settleWebhook(
    rawBody: string | null,
    signature: string | undefined,
    body: Record<string, any>
  ) {
    if (!rawBody || !this.paystack.verifyWebhookSignature(rawBody, signature)) {
      throw new CustomerPurchaseException('Invalid Paystack webhook signature.')
    }

    const reference = body?.data?.reference
    if (typeof reference !== 'string' || reference.length === 0) {
      throw new CustomerPurchaseException('Paystack webhook is missing a reference.')
    }

    return this.verify(reference)
  }

  private async settle(
    reference: string,
    verification: {
      status: string
      amount: number
      currency: string
      paidAt: string | null
      raw: unknown
    }
  ) {
    return db.transaction(async (trx) => {
      const transaction = await PaymentTransaction.query({ client: trx })
        .where('providerReference', reference)
        .forUpdate()
        .firstOrFail()

      const purchase = await Purchase.query({ client: trx })
        .where('id', transaction.purchaseId)
        .preload('items')
        .firstOrFail()

      if (transaction.status === PaymentStatus.SUCCESS && purchase.status === PurchaseStatus.PAID) {
        return { purchase, transaction }
      }

      if (
        verification.status !== PaymentStatus.SUCCESS ||
        verification.amount !== transaction.amount ||
        verification.currency !== transaction.currency
      ) {
        await this.markFailedPurchase(purchase, transaction, verification.raw)
        return { purchase, transaction }
      }

      const paidAt = verification.paidAt ? DateTime.fromISO(verification.paidAt) : DateTime.now()
      transaction.merge({
        status: PaymentStatus.SUCCESS,
        providerPayload: JSON.stringify(verification.raw),
        paidAt,
        failedAt: null,
      })
      await transaction.save()

      purchase.merge({
        status: PurchaseStatus.PAID,
        paidAt,
        failedAt: null,
      })
      await purchase.save()

      const enrollmentIds = purchase.items.length
        ? purchase.items.map((item) => item.enrollmentId)
        : await this.enrollmentIdsForSignup(purchase.signupId, purchase.swimYearId, trx)
      const paidAtSql = paidAt.toSQL({ includeOffset: false })
      await Enrollment.query({ client: trx }).whereIn('id', enrollmentIds).update({
        status: EnrollmentStatus.ACTIVE,
        reservedUntil: null,
      })
      await TermPayment.query({ client: trx })
        .whereIn('enrollmentId', enrollmentIds)
        .update({
          status: PaymentStatus.SUCCESS,
          amountPaid: db.ref('amount'),
          provider: 'paystack',
          paymentTransactionId: transaction.id,
          paidAt: paidAtSql,
        })

      return { purchase, transaction }
    })
  }

  private async enrollmentIdsForSignup(
    signupId: number,
    swimYearId: number,
    trx: TransactionClientContract
  ): Promise<number[]> {
    const enrollments = await Enrollment.query({ client: trx })
      .whereHas('learner', (learnerQuery) => learnerQuery.where('signupId', signupId))
      .where('swimYearId', swimYearId)
      .select('id')

    return enrollments.map((enrollment) => enrollment.id)
  }

  private async markInitializationFailed(transaction: PaymentTransaction) {
    await db.transaction(async (trx) => {
      const failedTransaction = await PaymentTransaction.findOrFail(transaction.id, { client: trx })
      const purchase = await Purchase.query({ client: trx })
        .where('id', failedTransaction.purchaseId)
        .preload('items')
        .firstOrFail()

      await this.markFailedPurchase(purchase, failedTransaction, null)
    })
  }

  private async markFailedPurchase(
    purchase: Purchase,
    transaction: PaymentTransaction,
    providerPayload: unknown
  ) {
    const failedAt = DateTime.now()
    transaction.merge({
      status: PaymentStatus.FAILED,
      providerPayload: providerPayload
        ? JSON.stringify(providerPayload)
        : transaction.providerPayload,
      failedAt,
    })
    await transaction.save()

    purchase.merge({
      status: PurchaseStatus.FAILED,
      failedAt,
    })
    await purchase.save()

    const enrollmentIds = purchase.items.map((item) => item.enrollmentId)
    if (enrollmentIds.length > 0) {
      await Enrollment.query({ client: purchase.$trx }).whereIn('id', enrollmentIds).update({
        status: EnrollmentStatus.CANCELLED,
        reservedUntil: null,
      })
      await TermPayment.query({ client: purchase.$trx })
        .whereIn('enrollmentId', enrollmentIds)
        .update({
          status: PaymentStatus.FAILED,
        })
    }
  }

  private async loadSwimYear(school: School): Promise<SwimYear> {
    const today = DateTime.now().toISODate()!
    const swimYears = await SwimYear.query()
      .where('schoolId', school.id)
      .where('endsOn', '>=', today)
      .preload('terms', (termsQuery) => termsQuery.orderBy('position'))
      .orderBy('startsOn')

    const swimYear = swimYears.find((year) => year.status === 'current') ?? swimYears[0]
    if (!swimYear) {
      throw new CustomerPurchaseException('No active swim year is set up for this school.')
    }

    return swimYear
  }

  private async loadLevels(school: School, publicIds: string[]): Promise<Map<string, Level>> {
    const levels = await Level.query()
      .whereIn('publicId', [...new Set(publicIds)])
      .preload('program')
      .preload('schoolLevelSettings', (settingsQuery) => settingsQuery.where('schoolId', school.id))

    const map = new Map<string, Level>()
    for (const level of levels) {
      const preloaded = level.$preloaded as {
        program?: Program
        schoolLevelSettings?: SchoolLevelSetting[]
      }
      const setting = preloaded.schoolLevelSettings?.[0]
      if (preloaded.program?.isActive && setting?.available !== false && level.publicId) {
        map.set(level.publicId, level)
      }
    }

    return map
  }

  private effectiveLevelFee(level: Level): number {
    const preloaded = level.$preloaded as { schoolLevelSettings?: SchoolLevelSetting[] }
    return preloaded.schoolLevelSettings?.[0]?.fee ?? level.defaultFee
  }

  private async assertCapacityAvailable(
    level: Level,
    swimYearId: number,
    trx: TransactionClientContract
  ): Promise<void> {
    if (level.capacity === null) {
      return
    }

    const now = DateTime.now().toSQL({ includeOffset: false })!
    const rows = await Enrollment.query({ client: trx })
      .where('levelId', level.id)
      .where('swimYearId', swimYearId)
      .where((query) => {
        query
          .where('status', EnrollmentStatus.ACTIVE)
          .orWhere((pending) =>
            pending.where('status', EnrollmentStatus.PENDING).where('reservedUntil', '>', now)
          )
      })
      .forUpdate()
      .count('* as total')

    if (Number(rows[0].$extras.total) >= level.capacity) {
      throw new CustomerPurchaseException('This level is full for the year.')
    }
  }

  private callbackUrl(
    reference: string,
    context: { organisationSlug: string; schoolSlug: string }
  ): string {
    const configured = env.get('PAYSTACK_CALLBACK_URL')
    const base =
      configured ??
      `${appUrl}/api/register/${context.organisationSlug}/${context.schoolSlug}/purchases/verify`
    const url = new URL(base)
    url.searchParams.set('reference', reference)
    return url.toString()
  }

  private makeReference(): string {
    return `sag_${DateTime.now().toFormat('yyyyLLddHHmmss')}_${randomUUID().replaceAll('-', '').slice(0, 12)}`
  }
}
