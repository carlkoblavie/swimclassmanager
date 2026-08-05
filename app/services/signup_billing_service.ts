import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Enrollment from '#models/enrollment'
import PaymentTransaction from '#models/payment_transaction'
import Purchase from '#models/purchase'
import Signup from '#models/signup'
import TermPayment from '#models/term_payment'
import { EnrollmentStatus } from '#values/enrollment_status'
import { PaymentStatus } from '#values/payment_status'
import { PurchaseStatus } from '#values/purchase_status'

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

      if (purchase.status === PurchaseStatus.PAID) {
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

      const enrollmentIds = purchase.items.map((item) => item.enrollmentId)
      if (enrollmentIds.length > 0) {
        const paidAtSql = paidAt.toSQL({ includeOffset: false })
        await Enrollment.query({ client: trx }).whereIn('id', enrollmentIds).update({
          status: EnrollmentStatus.ACTIVE,
          reservedUntil: null,
        })
        await TermPayment.query({ client: trx }).whereIn('enrollmentId', enrollmentIds).update({
          status: PaymentStatus.SUCCESS,
          provider: 'manual',
          providerReference: transaction.providerReference,
          paymentTransactionId: transaction.id,
          paidAt: paidAtSql,
        })
      }

      return purchase
    })
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
