export const LessonActivityCategoryPurpose = {
  WARM_UP: 1,
  START: 2,
  CORE_SKILLS: 3,
  DRILLS: 4,
  CHALLENGE: 5,
  CONCLUSION: 6,
} as const

export type LessonActivityCategoryPurpose =
  (typeof LessonActivityCategoryPurpose)[keyof typeof LessonActivityCategoryPurpose]
