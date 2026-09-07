import vine from '@vinejs/vine'
import { LESSON_ACTIVITY_LEADER_VALUES } from '#values/lesson_activity_leader'

// A class is now stage + skills + duration + instructors. It no longer carries
// a weekday or start time — those are set later, when the class is scheduled.
const classCurriculumFields = {
  levelStageId: vine.number().withoutDecimals().positive(),
  skillIds: vine.array(vine.number().withoutDecimals().positive()).distinct().optional(),
}

const redirectFields = {
  redirectTo: vine.enum(['back']).optional(),
}

const instructorFields = {
  // One lead instructor, plus optional supporting instructors.
  leadInstructorMembershipId: vine.number().withoutDecimals().positive().optional(),
  leadInstructorInvitationId: vine.number().withoutDecimals().positive().optional(),
  supportingInstructorMembershipIds: vine
    .array(vine.number().withoutDecimals().positive())
    .distinct()
    .optional(),
  supportingInstructorInvitationIds: vine
    .array(vine.number().withoutDecimals().positive())
    .distinct()
    .optional(),
  // Legacy accepted members and still-pending teacher invitations, kept so old
  // callers continue to save while the UI moves to lead/supporting fields.
  instructorMembershipIds: vine
    .array(vine.number().withoutDecimals().positive())
    .distinct()
    .optional(),
  instructorInvitationIds: vine
    .array(vine.number().withoutDecimals().positive())
    .distinct()
    .optional(),
  // Optionally invite one new teacher and attach them alongside the above.
  inviteTeacherEmail: vine.string().trim().normalizeEmail().email().maxLength(254).optional(),
  inviteTeacherFirstName: vine.string().trim().minLength(1).maxLength(120).optional(),
  inviteTeacherLastName: vine.string().trim().minLength(1).maxLength(120).optional(),
  inviteTeacherPhone: vine.string().trim().minLength(1).maxLength(50).optional(),
  inviteTeacherCertifications: vine
    .array(vine.string().trim().minLength(1).maxLength(120))
    .optional(),
}

// Create a single class. Name is optional — a name is generated from the level
// and stage when left blank.
export const storeSwimmingClassesValidator = vine.create({
  levelId: vine.number().withoutDecimals().positive().exists({ table: 'levels', column: 'id' }),
  termId: vine.number().withoutDecimals().positive().exists({ table: 'terms', column: 'id' }),
  name: vine.string().trim().minLength(1).maxLength(120).optional(),
  aim: vine.string().trim().minLength(1).maxLength(500),
  assessmentGoals: vine
    .array(vine.string().trim().minLength(1).maxLength(500))
    .minLength(1)
    .maxLength(50),
  prerequisiteStageId: vine.number().withoutDecimals().positive().optional(),
  durationMinutes: vine.number().withoutDecimals().positive(),
  maxLessons: vine.number().withoutDecimals().positive(),
  ...classCurriculumFields,
  ...instructorFields,
  ...redirectFields,
})

export const updateSwimmingClassValidator = vine.create({
  // Optional so classes created before swim years existed can be tied later.
  termId: vine
    .number()
    .withoutDecimals()
    .positive()
    .exists({ table: 'terms', column: 'id' })
    .optional(),
  name: vine.string().trim().minLength(1).maxLength(120).optional(),
  aim: vine.string().trim().minLength(1).maxLength(500),
  assessmentGoals: vine
    .array(vine.string().trim().minLength(1).maxLength(500))
    .minLength(1)
    .maxLength(50),
  prerequisiteStageId: vine.number().withoutDecimals().positive().optional(),
  durationMinutes: vine.number().withoutDecimals().positive(),
  location: vine.string().trim().maxLength(255).nullable().optional(),
  maxLessons: vine.number().withoutDecimals().positive(),
  ...classCurriculumFields,
  ...instructorFields,
  ...redirectFields,
})

export const storeClassLessonValidator = vine.create({
  objectives: vine.string().trim().minLength(1).maxLength(2000),
  equipment: vine.array(vine.string().trim().minLength(1).maxLength(120)).distinct().optional(),
  schoolActivityIds: vine.array(vine.number().withoutDecimals().positive()).optional(),
  schoolActivityDurations: vine.array(vine.number().withoutDecimals().positive()).optional(),
  schoolActivityLedBys: vine
    .array(vine.number().withoutDecimals().in(LESSON_ACTIVITY_LEADER_VALUES))
    .optional(),
  customActivityNames: vine.array(vine.string().trim().minLength(1).maxLength(120)).optional(),
  customActivityCategoryIds: vine.array(vine.number().withoutDecimals().positive()).optional(),
  customActivityDescriptions: vine
    .array(vine.string().trim().maxLength(2000).nullable())
    .optional(),
  customActivitySuccessCues: vine.array(vine.string().trim().maxLength(255).nullable()).optional(),
  customActivityDurations: vine.array(vine.number().withoutDecimals().positive()).optional(),
  customActivityLedBys: vine
    .array(vine.number().withoutDecimals().in(LESSON_ACTIVITY_LEADER_VALUES))
    .optional(),
  activityIds: vine.array(vine.number().withoutDecimals().positive()).distinct().optional(),
  notes: vine.string().trim().maxLength(2000).nullable().optional(),
  observation: vine.string().trim().maxLength(2000).nullable().optional(),
  intent: vine.string().trim().maxLength(20).optional(),
})

export const updateLessonActivitiesValidator = vine.create({
  schoolActivityIds: vine.array(vine.number().withoutDecimals().positive()).optional(),
  schoolActivityDurations: vine.array(vine.number().withoutDecimals().positive()).optional(),
  schoolActivityLedBys: vine
    .array(vine.number().withoutDecimals().in(LESSON_ACTIVITY_LEADER_VALUES))
    .optional(),
  customActivityNames: vine.array(vine.string().trim().minLength(1).maxLength(120)).optional(),
  customActivityCategoryIds: vine.array(vine.number().withoutDecimals().positive()).optional(),
  customActivityDescriptions: vine
    .array(vine.string().trim().maxLength(2000).nullable())
    .optional(),
  customActivitySuccessCues: vine.array(vine.string().trim().maxLength(255).nullable()).optional(),
  customActivityDurations: vine.array(vine.number().withoutDecimals().positive()).optional(),
  customActivityLedBys: vine
    .array(vine.number().withoutDecimals().in(LESSON_ACTIVITY_LEADER_VALUES))
    .optional(),
  activityIds: vine.array(vine.number().withoutDecimals().positive()).distinct().optional(),
})

export const generateClassLessonsValidator = vine.create({
  classId: vine.number().withoutDecimals().positive().exists({
    table: 'swimming_classes',
    column: 'id',
  }),
  startDate: vine.date({ formats: ['YYYY-MM-DD'] }),
  endDate: vine.date({ formats: ['YYYY-MM-DD'] }).afterOrSameAs('startDate'),
  startTime: vine
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/),
  weekdays: vine
    .array(vine.number().withoutDecimals().min(1).max(7))
    .minLength(1)
    .maxLength(7)
    .distinct(),
})

export const copyLessonActivitiesValidator = vine.create({
  targetLessonIds: vine
    .array(vine.number().withoutDecimals().positive())
    .minLength(1)
    .maxLength(100)
    .distinct(),
})

export const assignLessonInstructorsValidator = vine.create({
  date: vine.date({ formats: ['YYYY-MM-DD'] }).optional(),
  objectives: vine.array(vine.string().trim().minLength(1).maxLength(500)).minLength(1),
  leadInstructorMembershipId: vine.number().withoutDecimals().positive().optional(),
  leadInstructorInvitationId: vine.number().withoutDecimals().positive().optional(),
  supportingInstructorMembershipIds: vine
    .array(vine.number().withoutDecimals().positive())
    .distinct()
    .optional(),
  supportingInstructorInvitationIds: vine
    .array(vine.number().withoutDecimals().positive())
    .distinct()
    .optional(),
})

export const bulkAssignLessonInstructorsValidator = vine.create({
  lessonIds: vine
    .array(vine.number().withoutDecimals().positive())
    .minLength(1)
    .maxLength(100)
    .distinct(),
  leadInstructorMembershipId: vine.number().withoutDecimals().positive().optional(),
  leadInstructorInvitationId: vine.number().withoutDecimals().positive().optional(),
  supportingInstructorMembershipIds: vine
    .array(vine.number().withoutDecimals().positive())
    .distinct()
    .optional(),
  supportingInstructorInvitationIds: vine
    .array(vine.number().withoutDecimals().positive())
    .distinct()
    .optional(),
})

export type StoreSwimmingClassesInput = Awaited<
  ReturnType<typeof storeSwimmingClassesValidator.validate>
>
export type UpdateSwimmingClassInput = Awaited<
  ReturnType<typeof updateSwimmingClassValidator.validate>
>
export type StoreClassLessonInput = Awaited<ReturnType<typeof storeClassLessonValidator.validate>>
export type UpdateLessonActivitiesInput = Awaited<
  ReturnType<typeof updateLessonActivitiesValidator.validate>
>
export type GenerateClassLessonsInput = Awaited<
  ReturnType<typeof generateClassLessonsValidator.validate>
>
export type BulkAssignLessonInstructorsInput = Awaited<
  ReturnType<typeof bulkAssignLessonInstructorsValidator.validate>
>
