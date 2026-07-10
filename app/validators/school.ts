import vine from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'
import db from '@adonisjs/lucid/services/db'

async function uniqueSchoolInOrganisation(
  value: unknown,
  _options: undefined,
  field: FieldContext
) {
  if (typeof value !== 'string') {
    return
  }

  const organisationId = field.parent.organisationId as number | undefined
  if (!organisationId) {
    return
  }

  const location = String(field.parent.location ?? '')
    .trim()
    .toLowerCase()

  const existing = await db
    .from('schools')
    .where('organisation_id', organisationId)
    .whereRaw('lower(name) = ?', [value.trim().toLowerCase()])
    .whereRaw('lower(location) = ?', [location])
    .first()

  if (existing) {
    field.report(
      'You already have a school with this name and location.',
      'school.duplicate',
      field
    )
  }
}

const uniqueSchoolInOrganisationRule = vine.createRule(uniqueSchoolInOrganisation)

export const storeSchoolValidator = vine.withMetaData<{ userId: number }>().create({
  organisationId: vine.number().withoutDecimals().positive().optional(),
  organisationName: vine.string().trim().minLength(1).maxLength(255).optional(),
  schoolName: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(255)
    .use(uniqueSchoolInOrganisationRule()),
  location: vine.string().trim().minLength(1).maxLength(255),
})
