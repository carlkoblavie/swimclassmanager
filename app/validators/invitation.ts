import vine from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'
import db from '@adonisjs/lucid/services/db'
import { RoleName } from '#values/role'

// uniqueInviteeEmail — rejects an email already belonging to a user in the
// inviter's organisation, while preserving the more useful message for an
// active member of this school.
async function notAlreadyMember(value: unknown, _options: undefined, field: FieldContext) {
  if (typeof value !== 'string') {
    return
  }

  const schoolId = field.meta.schoolId as number
  const organisationId = field.meta.organisationId as number
  const existingUser = await db
    .from('memberships')
    .join('schools', 'schools.id', 'memberships.school_id')
    .join('users', 'users.id', 'memberships.user_id')
    .where('schools.organisation_id', organisationId)
    .whereRaw('LOWER(users.email) = LOWER(?)', [value])
    .select('users.id')
    .first()

  if (!existingUser) {
    return
  }

  const existingMember = await db
    .from('memberships')
    .join('users', 'users.id', 'memberships.user_id')
    .where('memberships.school_id', schoolId)
    .where('memberships.user_id', existingUser.id)
    .first()

  if (existingMember) {
    field.report('This person is already a member.', 'invitation.member', field)
    return
  }

  field.report('This email is already in use.', 'invitation.emailUnique', field)
}

const notAlreadyMemberRule = vine.createRule(notAlreadyMember)

async function uniquePhone(value: unknown, _options: undefined, field: FieldContext) {
  if (typeof value !== 'string') {
    return
  }

  const organisationId = field.meta.organisationId as number
  const existing = await db
    .from('memberships')
    .join('schools', 'schools.id', 'memberships.school_id')
    .join('users', 'users.id', 'memberships.user_id')
    .where('schools.organisation_id', organisationId)
    .where('users.phone', value)
    .select('users.id')
    .first()
  if (existing) {
    field.report('This phone number is already in use.', 'invitation.phoneUnique', field)
  }
}

const uniquePhoneRule = vine.createRule(uniquePhone)

export const storeInvitationValidator = vine
  .withMetaData<{ schoolId: number; organisationId: number }>()
  .create({
    firstName: vine.string().trim().minLength(1).maxLength(120),
    lastName: vine.string().trim().minLength(1).maxLength(120),
    phone: vine.string().trim().minLength(1).maxLength(50).use(uniquePhoneRule()),
    email: vine.string().trim().normalizeEmail().email().maxLength(254).use(notAlreadyMemberRule()),
    role: vine.enum([RoleName.TEACHER, RoleName.ASSISTANT_COACH, RoleName.DECK_SUPERVISOR]),
  })
