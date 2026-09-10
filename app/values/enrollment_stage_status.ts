export const EnrollmentStageStatus = {
  UPCOMING: 'upcoming',
  CURRENT: 'current',
  COMPLETED: 'completed',
} as const

export type EnrollmentStageStatus =
  (typeof EnrollmentStageStatus)[keyof typeof EnrollmentStageStatus]

export const ENROLLMENT_STAGE_STATUS_VALUES = Object.values(EnrollmentStageStatus)
