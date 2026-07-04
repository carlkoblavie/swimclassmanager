import vine from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'
import db from '@adonisjs/lucid/services/db'

// uniqueProgramName — rejects a name that already exists platform-wide
// (case-insensitive), excluding the program being edited when `programId` meta
// is present.
async function uniqueProgramName(value: unknown, _options: undefined, field: FieldContext) {
  if (typeof value !== 'string') {
    return
  }

  const excludeId = field.meta.programId as number | undefined
  const query = db.from('programs').whereRaw('lower(name) = ?', [value.trim().toLowerCase()])
  if (excludeId) {
    query.whereNot('id', excludeId)
  }

  const existing = await query.first()
  if (existing) {
    field.report('A program with this name already exists', 'program.uniqueName', field)
  }
}

const uniqueProgramNameRule = vine.createRule(uniqueProgramName)

const levelObject = {
  name: vine.string().trim().minLength(1).maxLength(120),
  ageGroup: vine.string().trim().minLength(1).maxLength(80),
  description: vine.string().trim().minLength(1).maxLength(2000),
  defaultFee: vine.number().min(0).decimal([0, 2]), // cedis; converted to minor units in the service
  capacity: vine.number().withoutDecimals().positive(),
}

export const storeProgramValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(120).use(uniqueProgramNameRule()),
  description: vine.string().trim().minLength(1).maxLength(2000),
  levels: vine.array(vine.object(levelObject)).minLength(1),
})

export const updateProgramValidator = vine.withMetaData<{ programId: number }>().create({
  name: vine.string().trim().minLength(1).maxLength(120).use(uniqueProgramNameRule()),
  description: vine.string().trim().minLength(1).maxLength(2000),
  levels: vine.array(vine.object({ id: vine.number().optional(), ...levelObject })).minLength(1),
})
