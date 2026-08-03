export const PurchaseStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const

export type PurchaseStatus = (typeof PurchaseStatus)[keyof typeof PurchaseStatus]
