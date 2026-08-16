export const RoleName = {
  ADMINISTRATOR: 'Administrator',
  HEAD_COACH: 'Head Coach/Head Teacher',
  TEACHER: 'Teacher',
  ASSISTANT_COACH: 'Assistant Coach',
  DECK_SUPERVISOR: 'Deck Supervisor',
  PARENT: 'Parent',
  STUDENT: 'Student',
} as const

export type RoleName = (typeof RoleName)[keyof typeof RoleName]
