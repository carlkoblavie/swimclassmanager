import vine from '@vinejs/vine'
import { LESSON_ACTIVITY_LEADER_VALUES } from '#values/lesson_activity_leader'

const timeRule = () =>
  vine
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)

const classCurriculumFields = {
  levelStageId: vine.number().withoutDecimals().positive(),
  skillIds: vine.array(vine.number().withoutDecimals().positive()).distinct().optional(),
}

const dayObject = {
  weekday: vine.number().withoutDecimals().in([1, 2, 3, 4, 5, 6, 7]),
  startTime: timeRule(),
  durationMinutes: vine.number().withoutDecimals().positive(),
  name: vine.string().trim().minLength(1).maxLength(120),
  lessonDate: vine.date({ formats: ['YYYY-MM-DD'] }),
  ...classCurriculumFields,
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

export const storeSwimmingClassesValidator = vine.create({
  levelId: vine.number().withoutDecimals().positive().exists({ table: 'levels', column: 'id' }),
  termId: vine.number().withoutDecimals().positive().exists({ table: 'terms', column: 'id' }),
  // One instructor selection applies to every class created in the batch.
  ...instructorFields,
  days: vine.array(vine.object(dayObject)).notEmpty(),
})

export const updateSwimmingClassValidator = vine.create({
  // Optional so classes created before swim years existed can be tied later.
  termId: vine
    .number()
    .withoutDecimals()
    .positive()
    .exists({ table: 'terms', column: 'id' })
    .optional(),
  weekday: vine.number().withoutDecimals().in([1, 2, 3, 4, 5, 6, 7]),
  startTime: timeRule(),
  durationMinutes: vine.number().withoutDecimals().positive(),
  name: vine.string().trim().minLength(1).maxLength(120),
  location: vine.string().trim().maxLength(255).nullable().optional(),
  ...instructorFields,
  ...classCurriculumFields,
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
