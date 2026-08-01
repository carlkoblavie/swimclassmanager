export const ClassInstructorRole = {
  LEAD: 1,
  SUPPORTING: 2,
} as const

export type ClassInstructorRole = (typeof ClassInstructorRole)[keyof typeof ClassInstructorRole]
