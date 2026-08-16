import { BaseTransformer } from '@adonisjs/core/transformers'
import { DateTime } from 'luxon'
import type Learner from '#models/learner'
import type Purchase from '#models/purchase'
import type PurchaseItem from '#models/purchase_item'
import type Signup from '#models/signup'
import { PurchaseStatus } from '#values/purchase_status'

function formatCedis(minorUnits: number, currency = 'GHS'): string {
  return `${currency} ${(minorUnits / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function invoiceReference(purchase: Purchase): string {
  return `INV-${String(purchase.id).padStart(4, '0')}`
}

function ageFromDateOfBirth(dateOfBirth: DateTime): number {
  const today = DateTime.now()
  let age = today.year - dateOfBirth.year
  if (today.ordinal < dateOfBirth.ordinal) {
    age -= 1
  }
  return age
}

type TermPaymentForDisplay = {
  id: number
  termId: number
  amount: number
  amountPaid: number
  status: string
  $preloaded?: { term?: { name: string } }
}

type EnrollmentForDisplay = {
  status?: string
  $preloaded?: { termPayments?: TermPaymentForDisplay[] }
}

function hasOutstandingPayment(enrollment: EnrollmentForDisplay | undefined): boolean {
  return Boolean(
    enrollment?.$preloaded?.termPayments?.some((payment) => payment.amountPaid < payment.amount)
  )
}

export default class SignupTransformer extends BaseTransformer<Signup> {
  toObject() {
    const preloaded = this.resource.$preloaded as {
      learners?: Learner[]
      purchases?: Purchase[]
    }
    const learners = preloaded.learners ?? []
    const purchase = (preloaded.purchases ?? [])[0] ?? null
    const purchasePreloaded = purchase?.$preloaded as { items?: PurchaseItem[] } | undefined
    const items = purchasePreloaded?.items ?? []
    const itemsByLearnerId = new Map(items.map((item) => [item.learnerId, item]))
    const learnerEnrollments = learners.flatMap((learner) => {
      const learnerPreloaded = learner.$preloaded as
        | { enrollments?: EnrollmentForDisplay[] }
        | undefined
      return learnerPreloaded?.enrollments ?? []
    })
    const itemEnrollments = items.flatMap((item) => {
      const itemPreloaded = item.$preloaded as { enrollment?: EnrollmentForDisplay } | undefined
      return itemPreloaded?.enrollment ? [itemPreloaded.enrollment] : []
    })
    const paymentEnrollments = [...itemEnrollments, ...learnerEnrollments]
    const hasPartiallyPaidTerm = paymentEnrollments.some((enrollment) =>
      enrollment.$preloaded?.termPayments?.some(
        (payment) =>
          payment.status === 'partial' ||
          (payment.amountPaid > 0 && payment.amountPaid < payment.amount)
      )
    )
    const hasOutstandingTermPayment = paymentEnrollments.some(hasOutstandingPayment)
    const status = purchase
      ? purchase.status === PurchaseStatus.PAID
        ? 'paid'
        : hasPartiallyPaidTerm
          ? 'part_paid'
          : purchase.invoiceSentAt
            ? 'invoice_sent'
            : 'pending_invoice'
      : this.resource.closedAt
        ? 'closed'
        : 'open'

    return {
      ...this.pick(this.resource, [
        'id',
        'contactName',
        'contactEmail',
        'contactPhone',
        'whatsapp',
        'registrantRole',
        'message',
      ]),
      createdAt: {
        raw: this.resource.createdAt.toISO(),
        formatted: this.resource.createdAt.toFormat('d LLL yyyy'),
      },
      billing: {
        status,
        label:
          status === 'paid'
            ? 'Paid'
            : status === 'part_paid'
              ? 'Part paid'
              : status === 'invoice_sent'
                ? 'Invoice sent'
                : status === 'pending_invoice'
                  ? 'Pending invoice'
                  : status === 'closed'
                    ? 'Closed'
                    : 'Open',
        isEnquiry: !purchase,
        invoiceReference: purchase ? invoiceReference(purchase) : null,
        invoiceSentAt: purchase?.invoiceSentAt
          ? {
              raw: purchase.invoiceSentAt.toISO(),
              formatted: purchase.invoiceSentAt.toFormat('d LLL yyyy'),
            }
          : null,
        paidAt: purchase?.paidAt
          ? {
              raw: purchase.paidAt.toISO(),
              formatted: purchase.paidAt.toFormat('d LLL yyyy'),
            }
          : null,
        closedAt: this.resource.closedAt
          ? {
              raw: this.resource.closedAt.toISO(),
              formatted: this.resource.closedAt.toFormat('d LLL yyyy'),
            }
          : null,
        totalAmount: purchase
          ? {
              raw: purchase.totalAmount,
              formatted: formatCedis(purchase.totalAmount, purchase.currency),
            }
          : null,
        canMarkInvoiceSent:
          Boolean(purchase) && !purchase?.invoiceSentAt && purchase?.status !== 'paid',
        canRecordPartPayment: Boolean(purchase) && status !== 'paid' && hasOutstandingTermPayment,
        canMarkPaid: Boolean(purchase) && status !== 'paid',
        canCloseEnquiry: !purchase && status === 'open',
        canReopenEnquiry: !purchase && status === 'closed',
        items: items.map((item) => ({
          id: item.id,
          learnerId: item.learnerId,
          levelId: item.levelId,
          levelName: item.levelName,
          levelPublicId: item.levelPublicId,
          amount: {
            raw: item.amount,
            formatted: formatCedis(item.amount, item.currency),
          },
        })),
      },
      learners: learners.map((learner) => {
        const item = itemsByLearnerId.get(learner.id)
        const itemEnrollment = (
          item?.$preloaded as { enrollment?: EnrollmentForDisplay } | undefined
        )?.enrollment
        const learnerEnrollmentRecords =
          (learner.$preloaded as { enrollments?: EnrollmentForDisplay[] } | undefined)
            ?.enrollments ?? []
        const paymentCandidates = [itemEnrollment, ...learnerEnrollmentRecords].filter(
          (candidate): candidate is EnrollmentForDisplay => Boolean(candidate)
        )
        const termPayments = [
          ...new Map(
            paymentCandidates
              .flatMap((candidate) => candidate.$preloaded?.termPayments ?? [])
              .filter((payment) => payment.amountPaid < payment.amount)
              .map((payment) => [payment.id, payment] as const)
          ).values(),
        ]

        return {
          ...this.pick(learner, [
            'id',
            'firstName',
            'lastName',
            'gender',
            'relation',
            'nationality',
            'residentialLocation',
            'medicalInfo',
            'swimmingExperience',
          ]),
          age: ageFromDateOfBirth(learner.dateOfBirth),
          dateOfBirth: {
            raw: learner.dateOfBirth.toISODate(),
            formatted: learner.dateOfBirth.toFormat('dd LLL yyyy'),
          },
          purchaseItem: item
            ? {
                id: item.id,
                levelName: item.levelName,
                levelPublicId: item.levelPublicId,
                amount: {
                  raw: item.amount,
                  formatted: formatCedis(item.amount, item.currency),
                },
              }
            : null,
          termPayments: termPayments.map((payment) => ({
            id: payment.id,
            termId: payment.termId,
            termName: payment.$preloaded?.term?.name ?? 'Term',
            amount: {
              raw: payment.amount,
              formatted: formatCedis(payment.amount),
            },
            amountPaid: {
              raw: payment.amountPaid,
              formatted: formatCedis(payment.amountPaid),
            },
            balance: {
              raw: Math.max(payment.amount - payment.amountPaid, 0),
              formatted: formatCedis(Math.max(payment.amount - payment.amountPaid, 0)),
            },
            status: payment.status,
          })),
        }
      }),
    }
  }
}
