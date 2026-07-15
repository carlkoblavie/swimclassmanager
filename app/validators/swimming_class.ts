import vine from '@vinejs/vine'

const timeRule = () =>
  vine
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)

const curriculumFields = {
  levelStageId: vine.number().withoutDecimals().positive(),
  skillIds: vine.array(vine.number().withoutDecimals().positive()).distinct().optional(),
  activityIds: vine.array(vine.number().withoutDecimals().positive()).distinct().optional(),
}

const dayObject = {
  weekday: vine.number().withoutDecimals().in([1, 2, 3, 4, 5, 6, 7]),
  startTime: timeRule(),
  durationMinutes: vine.number().withoutDecimals().positive(),
  name: vine.string().trim().minLength(1).maxLength(120),
  ...curriculumFields,
}

export const storeSwimmingClassesValidator = vine.create({
  levelId: vine.number().withoutDecimals().positive().exists({ table: 'levels', column: 'id' }),
  days: vine.array(vine.object(dayObject)).notEmpty(),
})

export const updateSwimmingClassValidator = vine.create({
  weekday: vine.number().withoutDecimals().in([1, 2, 3, 4, 5, 6, 7]),
  startTime: timeRule(),
  durationMinutes: vine.number().withoutDecimals().positive(),
  name: vine.string().trim().minLength(1).maxLength(120),
  location: vine.string().trim().maxLength(255).nullable().optional(),
  instructorMode: vine.enum(['none', 'existing', 'invite']).optional(),
  instructorMembershipId: vine.number().withoutDecimals().positive().optional(),
  inviteTeacherEmail: vine.string().trim().normalizeEmail().email().maxLength(254).optional(),
  inviteTeacherName: vine.string().trim().minLength(1).maxLength(255).optional(),
  inviteTeacherPhone: vine.string().trim().minLength(1).maxLength(50).optional(),
  ...curriculumFields,
})

export type StoreSwimmingClassesInput = Awaited<
  ReturnType<typeof storeSwimmingClassesValidator.validate>
>
export type UpdateSwimmingClassInput = Awaited<
  ReturnType<typeof updateSwimmingClassValidator.validate>
>
