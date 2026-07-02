export const RoleName = {
  ADMINISTRATOR: 'Administrator',
  HEAD_COACH: 'Head Coach/Head Teacher',
  TEACHER: 'Teacher',
  DECK_SUPERVISOR: 'Deck Supervisor',
  PARENT: 'Parent',
  STUDENT: 'Student',
} as const

export type RoleName = (typeof RoleName)[keyof typeof RoleName]
