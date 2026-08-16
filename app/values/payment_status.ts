export const PaymentStatus = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]
