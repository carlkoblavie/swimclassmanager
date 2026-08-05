export const LearnerRelation = {
  MOTHER: 'mother',
  FATHER: 'father',
  GUARDIAN: 'guardian',
  GRANDPARENT: 'grandparent',
  SIBLING: 'sibling',
  SELF: 'self',
} as const

export type LearnerRelation = (typeof LearnerRelation)[keyof typeof LearnerRelation]
