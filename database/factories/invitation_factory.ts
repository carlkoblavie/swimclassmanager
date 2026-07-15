import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'
import string from '@adonisjs/core/helpers/string'
import Invitation from '#models/invitation'
import Role from '#models/role'
import { RoleName } from '#values/role'
import { SchoolFactory } from './school_factory.js'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

async function teacherRoleId(trx: TransactionClientContract | undefined): Promise<number> {
  const existing = await Role.findBy('name', RoleName.TEACHER, trx ? { client: trx } : undefined)
  if (existing) {
    return existing.id
  }

  const role = new Role()
  if (trx) {
    role.useTransaction(trx)
  }
  role.name = RoleName.TEACHER
  role.permissions = '[]' as never
  await role.save()
  return role.id
}

export const InvitationFactory = factory
  .define(Invitation, async ({ faker, $trx }) => {
    const school = $trx ? await SchoolFactory.client($trx).create() : await SchoolFactory.create()

    return {
      schoolId: school.id,
      roleId: await teacherRoleId($trx),
      email: faker.internet.email(),
      token: string.random(48),
      expiresAt: DateTime.now().plus({ days: 7 }),
    }
  })
  .state('expired', (invitation) => {
    invitation.expiresAt = DateTime.now().minus({ days: 1 })
  })
  .state('accepted', (invitation) => {
    invitation.acceptedAt = DateTime.now()
  })
  .build()
