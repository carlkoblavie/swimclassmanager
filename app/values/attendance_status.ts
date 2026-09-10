export const AttendanceStatus = {
  PRESENT: 'present',
  LATE: 'late',
  ABSENT: 'absent',
} as const

export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus]

export const ATTENDANCE_STATUS_VALUES = Object.values(AttendanceStatus)
