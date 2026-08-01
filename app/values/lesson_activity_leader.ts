export const LessonActivityLeader = {
  INSTRUCTOR: 1,
  LEARNER: 2,
  MIXED: 3,
} as const

export type LessonActivityLeader = (typeof LessonActivityLeader)[keyof typeof LessonActivityLeader]

export const LESSON_ACTIVITY_LEADER_VALUES = Object.values(LessonActivityLeader)

export function lessonActivityLeaderLabel(value: LessonActivityLeader): string {
  if (value === LessonActivityLeader.LEARNER) {
    return 'Learner-led'
  }

  if (value === LessonActivityLeader.MIXED) {
    return 'Mixed'
  }

  return 'Instructor-led'
}
