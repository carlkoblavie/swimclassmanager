import vine from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'
import db from '@adonisjs/lucid/services/db'
import { RoleName } from '#values/role'

// notAlreadyMember — rejects an email already belonging to an active member of the school
async function notAlreadyMember(value: unknown, _options: undefined, field: FieldContext) {
  if (typeof value !== 'string') {
    return
  }

  const schoolId = field.meta.schoolId as number
  const existing = await db
    .from('memberships')
    .join('users', 'users.id', 'memberships.user_id')
    .where('memberships.school_id', schoolId)
    .where('users.email', value)
    .first()

  if (existing) {
    field.report('This person is already a member.', 'invitation.member', field)
  }
}

const notAlreadyMemberRule = vine.createRule(notAlreadyMember)

export const storeInvitationValidator = vine.withMetaData<{ schoolId: number }>().create({
  firstName: vine.string().trim().minLength(1).maxLength(120),
  lastName: vine.string().trim().minLength(1).maxLength(120),
  phone: vine.string().trim().minLength(1).maxLength(50),
  email: vine.string().trim().normalizeEmail().email().maxLength(254).use(notAlreadyMemberRule()),
  role: vine.enum([
    RoleName.HEAD_COACH,
    RoleName.TEACHER,
    RoleName.DECK_SUPERVISOR,
    RoleName.PARENT,
  ]),
})
