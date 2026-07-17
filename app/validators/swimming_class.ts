import vine from '@vinejs/vine'

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
  instructorMode: vine.enum(['none', 'existing', 'invite']).optional(),
  instructorMembershipId: vine.number().withoutDecimals().positive().optional(),
  inviteTeacherEmail: vine.string().trim().normalizeEmail().email().maxLength(254).optional(),
  inviteTeacherName: vine.string().trim().minLength(1).maxLength(255).optional(),
  inviteTeacherPhone: vine.string().trim().minLength(1).maxLength(50).optional(),
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
  activityIds: vine.array(vine.number().withoutDecimals().positive()).distinct().optional(),
  notes: vine.string().trim().maxLength(2000).nullable().optional(),
})

export type StoreSwimmingClassesInput = Awaited<
  ReturnType<typeof storeSwimmingClassesValidator.validate>
>
export type UpdateSwimmingClassInput = Awaited<
  ReturnType<typeof updateSwimmingClassValidator.validate>
>
export type StoreClassLessonInput = Awaited<ReturnType<typeof storeClassLessonValidator.validate>>
