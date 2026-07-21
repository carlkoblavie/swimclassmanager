export const LevelAudience = {
  CHILD: 'child',
  ADULT: 'adult',
} as const

export type LevelAudience = (typeof LevelAudience)[keyof typeof LevelAudience]
