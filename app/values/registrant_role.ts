export const RegistrantRole = {
  GUARDIAN: 'guardian',
  ADULT_LEARNER: 'adult_learner',
} as const

export type RegistrantRole = (typeof RegistrantRole)[keyof typeof RegistrantRole]
