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
  durationMinutes: vine.number().withoutDecimals().positive(),
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
  durationMinutes: vine.number().withoutDecimals().positive(),
  location: vine.string().trim().maxLength(255).nullable().optional(),
  ...classCurriculumFields,
  ...instructorFields,
  ...redirectFields,
})

export const storeClassLessonValidator = vine.create({
  objectives: vine.string().trim().minLength(1).maxLength(2000),
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

export type StoreSwimmingClassesInput = Awaited<
  ReturnType<typeof storeSwimmingClassesValidator.validate>
>
export type UpdateSwimmingClassInput = Awaited<
  ReturnType<typeof updateSwimmingClassValidator.validate>
>
export type StoreClassLessonInput = Awaited<ReturnType<typeof storeClassLessonValidator.validate>>
