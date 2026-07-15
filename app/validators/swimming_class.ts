import vine from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'
import db from '@adonisjs/lucid/services/db'

async function uniqueClassCode(value: unknown, _options: undefined, field: FieldContext) {
  if (typeof value !== 'string' || value.trim() === '') {
    return
  }

  const schoolId = field.meta.schoolId as number
  const classId = field.meta.classId as number | undefined
  const query = db
    .from('swimming_classes')
    .where('school_id', schoolId)
    .whereRaw('lower(code) = ?', [value.trim().toLowerCase()])

  if (classId) {
    query.whereNot('id', classId)
  }

  const existing = await query.first()

  if (existing) {
    field.report('A class with this code already exists.', 'class.code.unique', field)
  }
}

const uniqueClassCodeRule = vine.createRule(uniqueClassCode)

const timeRule = () =>
  vine
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)

const stageObject = {
  name: vine.string().trim().minLength(1).maxLength(120),
  position: vine.number().withoutDecimals().positive(),
  skillIds: vine.array(vine.number().withoutDecimals().positive()).distinct().optional(),
  newSkills: vine
    .array(
      vine.object({
        name: vine.string().trim().minLength(1).maxLength(120),
        description: vine.string().trim().maxLength(2000).nullable().optional(),
      })
    )
    .optional(),
}

const swimmingClassDataSchema = {
  levelId: vine.number().withoutDecimals().positive().exists({ table: 'levels', column: 'id' }),
  code: vine.string().trim().toUpperCase().maxLength(30).use(uniqueClassCodeRule()).optional(),
  name: vine.string().trim().minLength(1).maxLength(120),
  startDate: vine.date({ formats: ['YYYY-MM-DD'] }),
  endDate: vine.date({ formats: ['YYYY-MM-DD'] }).afterOrSameAs('startDate'),
  weekdays: vine
    .array(vine.number().withoutDecimals().in([1, 2, 3, 4, 5, 6, 7]))
    .distinct()
    .notEmpty(),
  startTime: timeRule(),
  endTime: timeRule(),
  capacity: vine.number().withoutDecimals().positive(),
  location: vine.string().trim().minLength(1).maxLength(255),
  instructorMode: vine.enum(['existing', 'invite']),
  instructorMembershipId: vine.number().withoutDecimals().positive().optional(),
  inviteTeacherEmail: vine.string().trim().normalizeEmail().email().maxLength(254).optional(),
  inviteTeacherName: vine.string().trim().minLength(1).maxLength(255).optional(),
  inviteTeacherPhone: vine.string().trim().minLength(1).maxLength(50).optional(),
  stages: vine.array(vine.object(stageObject)).distinct('position').notEmpty(),
}

export const storeSwimmingClassValidator = vine
  .withMetaData<{ schoolId: number; classId?: number }>()
  .create(swimmingClassDataSchema)

export const updateSwimmingClassValidator = vine
  .withMetaData<{ schoolId: number; classId: number }>()
  .create(swimmingClassDataSchema)

export type StoreSwimmingClassInput = Awaited<
  ReturnType<typeof storeSwimmingClassValidator.validate>
>
export type UpdateSwimmingClassInput = Awaited<
  ReturnType<typeof updateSwimmingClassValidator.validate>
>
