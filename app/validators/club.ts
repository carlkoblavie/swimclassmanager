import vine from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'
import db from '@adonisjs/lucid/services/db'

/**
 * Founder-scoped, case-insensitive duplicate check: no two clubs with the same
 * name and location for the same founder. Reports its message inline so no
 * global messages provider is needed.
 */
async function uniqueClubForFounder(value: unknown, _options: undefined, field: FieldContext) {
  if (typeof value !== 'string') {
    return
  }

  const userId = field.meta.userId as number
  const location = String(field.parent.location ?? '')
    .trim()
    .toLowerCase()

  const existing = await db
    .from('clubs')
    .where('created_by_user_id', userId)
    .whereRaw('lower(name) = ?', [value.trim().toLowerCase()])
    .whereRaw('lower(location) = ?', [location])
    .first()

  if (existing) {
    field.report('You already have a club with this name and location.', 'club.duplicate', field)
  }
}

const uniqueClubForFounderRule = vine.createRule(uniqueClubForFounder)

export const storeClubValidator = vine.withMetaData<{ userId: number }>().create({
  name: vine.string().trim().minLength(1).maxLength(255).use(uniqueClubForFounderRule()),
  location: vine.string().trim().minLength(1).maxLength(255),
})
