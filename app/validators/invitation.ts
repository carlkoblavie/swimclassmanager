import vine from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'
import db from '@adonisjs/lucid/services/db'
import { RoleName } from '#values/role'

// notAlreadyMember — rejects an email already belonging to an active member of the club
async function notAlreadyMember(value: unknown, _options: undefined, field: FieldContext) {
  if (typeof value !== 'string') {
    return
  }

  const clubId = field.meta.clubId as number
  const existing = await db
    .from('memberships')
    .join('users', 'users.id', 'memberships.user_id')
    .where('memberships.club_id', clubId)
    .where('users.email', value)
    .first()

  if (existing) {
    field.report('This person is already a member.', 'invitation.member', field)
  }
}

const notAlreadyMemberRule = vine.createRule(notAlreadyMember)

export const storeInvitationValidator = vine.withMetaData<{ clubId: number }>().create({
  email: vine.string().trim().normalizeEmail().email().maxLength(254).use(notAlreadyMemberRule()),
  role: vine.enum([
    RoleName.HEAD_COACH,
    RoleName.TEACHER,
    RoleName.DECK_SUPERVISOR,
    RoleName.PARENT,
  ]),
})
