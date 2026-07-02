export const Gender = {
  MALE: 'Male',
  FEMALE: 'Female',
} as const

export type Gender = (typeof Gender)[keyof typeof Gender]
