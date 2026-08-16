import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'
import CustomerPurchaseException from '#exceptions/customer_purchase_exception'
import Enrollment from '#models/enrollment'
import PaymentTransaction from '#models/payment_transaction'
import Purchase from '#models/purchase'
import Signup from '#models/signup'
import TermPayment from '#models/term_payment'
import { EnrollmentStatus } from '#values/enrollment_status'
import { PaymentStatus } from '#values/payment_status'
import { PurchaseStatus } from '#values/purchase_status'
import type { Infer } from '@vinejs/vine/types'
import type { recordPartPaymentValidator } from '#validators/signup'

type RecordPartPaymentInput = Infer<typeof recordPartPaymentValidator>

export default class SignupBillingService {
  async closeEnquiry(schoolId: number, signupId: number): Promise<Signup | null> {
    const signup = await this.enquirySignup(schoolId, signupId)
    if (!signup) {
      return null
    }

    signup.closedAt = DateTime.now()
    await signup.save()

    return signup
  }

  async reopenEnquiry(schoolId: number, signupId: number): Promise<Signup | null> {
    const signup = await this.enquirySignup(schoolId, signupId)
    if (!signup) {
      return null
    }

    signup.closedAt = null
    await signup.save()

    return signup
  }

  async markInvoiceSent(schoolId: number, signupId: number): Promise<Purchase | null> {
    const purchase = await this.latestPurchase(schoolId, signupId)
    if (!purchase) {
      return null
    }

    if (!purchase.invoiceSentAt) {
      purchase.invoiceSentAt = DateTime.now()
      await purchase.save()
    }

    return purchase
  }

  async markPaid(schoolId: number, signupId: number): Promise<Purchase | null> {
    return db.transaction(async (trx) => {
      const purchase = await Purchase.query({ client: trx })
        .where('schoolId', schoolId)
        .where('signupId', signupId)
        .preload('items')
        .orderBy('createdAt', 'desc')
        .forUpdate()
        .first()

      if (!purchase) {
        return null
      }

      const enrollmentIds = purchase.items.length
        ? purchase.items.map((item) => item.enrollmentId)
        : await this.enrollmentIdsForSignup(purchase.signupId, purchase.swimYearId, trx)

      if (purchase.status === PurchaseStatus.PAID) {
        await this.syncPaidEnrollments(enrollmentIds, null, trx)
        return purchase
      }

      const paidAt = DateTime.now()
      purchase.useTransaction(trx)
      purchase.merge({
        status: PurchaseStatus.PAID,
        paidAt,
        failedAt: null,
        invoiceSentAt: purchase.invoiceSentAt ?? paidAt,
      })
      await purchase.save()

      const transaction = await PaymentTransaction.create(
        {
          purchaseId: purchase.id,
          provider: 'manual',
          providerReference: this.manualReference(purchase),
          status: PaymentStatus.SUCCESS,
          amount: purchase.totalAmount,
          currency: purchase.currency,
          paidAt,
          failedAt: null,
          providerPayload: JSON.stringify({ source: 'admin' }),
        },
        { client: trx }
      )

      if (enrollmentIds.length > 0) {
        await this.syncPaidEnrollments(enrollmentIds, transaction, trx, paidAt)
      }

      return purchase
    })
  }

  async recordPartPayment(
    schoolId: number,
    signupId: number,
    input: RecordPartPaymentInput
  ): Promise<void> {
    await db.transaction(async (trx) => {
      const enrollment = await Enrollment.query({ client: trx })
        .where('schoolId', schoolId)
        .where('learnerId', input.learnerId)
        .whereHas('learner', (learnerQuery) => learnerQuery.where('signupId', signupId))
        .first()

      if (!enrollment) {
        throw new CustomerPurchaseException('This learner is not part of the selected sign-up.')
      }

      const payment = await TermPayment.query({ client: trx })
        .where('enrollmentId', enrollment.id)
        .where('termId', input.termId)
        .forUpdate()
        .first()

      if (!payment) {
        throw new CustomerPurchaseException('No payment is due for this learner and term.')
      }

      const amountMinor = Math.round(input.amount * 100)
      const outstanding = payment.amount - payment.amountPaid
      if (amountMinor > outstanding) {
        throw new CustomerPurchaseException('The payment cannot exceed the remaining balance.')
      }

      const amountPaid = payment.amountPaid + amountMinor
      const isPaid = amountPaid >= payment.amount
      payment.useTransaction(trx)
      payment.merge({
        amountPaid,
        status: isPaid ? PaymentStatus.SUCCESS : PaymentStatus.PARTIAL,
        provider: 'manual',
        paidAt: isPaid ? DateTime.now() : null,
      })
      await payment.save()

      if (enrollment.status === EnrollmentStatus.PENDING) {
        enrollment.useTransaction(trx)
        enrollment.merge({ status: EnrollmentStatus.ACTIVE, reservedUntil: null })
        await enrollment.save()
      }
    })
  }

  private async syncPaidEnrollments(
    enrollmentIds: number[],
    transaction: PaymentTransaction | null,
    trx: TransactionClientContract,
    paidAt = DateTime.now()
  ) {
    if (enrollmentIds.length === 0) {
      return
    }

    await Enrollment.query({ client: trx }).whereIn('id', enrollmentIds).update({
      status: EnrollmentStatus.ACTIVE,
      reservedUntil: null,
    })
    const payments = await TermPayment.query({ client: trx }).whereIn('enrollmentId', enrollmentIds)
    for (const payment of payments) {
      await TermPayment.query({ client: trx })
        .where('id', payment.id)
        .update({
          status: PaymentStatus.SUCCESS,
          amountPaid: payment.amount,
          provider: transaction?.provider ?? 'manual',
          providerReference: transaction?.providerReference ?? null,
          paymentTransactionId: transaction?.id ?? null,
          paidAt: paidAt.toSQL({ includeOffset: false }),
        })
    }
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

  private latestPurchase(schoolId: number, signupId: number): Promise<Purchase | null> {
    return Purchase.query()
      .where('schoolId', schoolId)
      .where('signupId', signupId)
      .orderBy('createdAt', 'desc')
      .first()
  }

  private async enquirySignup(schoolId: number, signupId: number): Promise<Signup | null> {
    const purchase = await this.latestPurchase(schoolId, signupId)
    if (purchase) {
      return null
    }

    return Signup.query().where('id', signupId).where('schoolId', schoolId).first()
  }

  private manualReference(purchase: Purchase): string {
    return `manual:${purchase.publicId}:${Date.now()}`
  }
}
