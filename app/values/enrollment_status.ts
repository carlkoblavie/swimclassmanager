export const EnrollmentStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const

export type EnrollmentStatus = (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus]
