import string from '@adonisjs/core/helpers/string'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'
import ClassAuthoringException from '#exceptions/class_authoring_exception'
import InvitationMail from '#mails/invitation'
import Invitation from '#models/invitation'
import LevelStage from '#models/level_stage'
import Membership from '#models/membership'
import Role from '#models/role'
import StageInstructor from '#models/stage_instructor'
import type School from '#models/school'
import {
  buildStageInstructorMap,
  type TransformedInstructor,
} from '#transformers/swimming_class_transformer'
import { ClassInstructorRole, type ClassInstructorRole as RoleValue } from '#values/class_instructor_role'
import { RoleName } from '#values/role'
import type { AssignStageInstructorsInput } from '#validators/swimming_class'

const INSTRUCTOR_ROLE_NAMES = [
  RoleName.TEACHER,
  RoleName.ASSISTANT_COACH,
  RoleName.HEAD_COACH,
] as string[]

function hasInstructorRole(membership: Membership): boolean {
  return membership.roles.some((role) => INSTRUCTOR_ROLE_NAMES.includes(role.name))
}

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values)]
}

type InstructorAssignment = {
  role: RoleValue
  membershipId: number | null
  invitationId: number | null
}

type ResolvedInstructors = {
  assignments: InstructorAssignment[]
  newInvitation?: Invitation
}

export default class StageInstructorService {
  /**
   * A school's stage instructors keyed by levelStageId, ready for the swimming
   * class transformer. Pass the stage ids in view to keep the query small.
   */
  async mapForSchool(
    schoolId: number,
    levelStageIds: number[]
  ): Promise<Map<number, TransformedInstructor[]>> {
    if (levelStageIds.length === 0) {
      return new Map()
    }
    const rows = await StageInstructor.query()
      .where('schoolId', schoolId)
      .whereIn('levelStageId', [...new Set(levelStageIds)])
      .preload('membership', (membershipQuery) => membershipQuery.preload('user'))
      .preload('invitation')
      .orderBy('role')
    return buildStageInstructorMap(rows)
  }

  /**
   * Assign a school's instructors (one lead, many assistants) to a curriculum
   * stage, replacing any existing staffing. Classes and lessons in the stage
   * follow this set.
   */
  async assign(school: School, data: AssignStageInstructorsInput): Promise<void> {
    await db.transaction(async (trx) => {
      const stage = await LevelStage.findOrFail(data.levelStageId, { client: trx })
      const resolved = await this.resolveInstructors(school, data, trx)

      await StageInstructor.query({ client: trx })
        .where('schoolId', school.id)
        .where('levelStageId', stage.id)
        .delete()

      if (resolved.assignments.length > 0) {
        await StageInstructor.createMany(
          resolved.assignments.map((assignment) => ({
            schoolId: school.id,
            levelStageId: stage.id,
            membershipId: assignment.membershipId,
            invitationId: assignment.invitationId,
            role: assignment.role,
          })),
          { client: trx }
        )
      }

      this.queueInvitationMail(resolved, school, trx)
    })
  }

  /**
   * Validate the selected instructor set: memberships must be Teachers or Head
   * Coaches of the school, invitations must be this school's pending Teacher or
   * Assistant Coach invitations, and the optional invite-new fields create (or
   * refresh) an invitation that joins the set.
   */
  protected async resolveInstructors(
    school: School,
    data: AssignStageInstructorsInput,
    trx: TransactionClientContract
  ): Promise<ResolvedInstructors> {
    if (data.leadInstructorMembershipId && data.leadInstructorInvitationId) {
      throw new ClassAuthoringException('Choose only one lead instructor.')
    }

    const leadMembershipId = data.leadInstructorMembershipId
    const leadInvitationId = data.leadInstructorInvitationId

    const supportingMembershipIds = uniqueNumbers(
      data.supportingInstructorMembershipIds ?? []
    ).filter((id) => id !== leadMembershipId)
    const supportingInvitationIds = uniqueNumbers(
      data.supportingInstructorInvitationIds ?? []
    ).filter((id) => id !== leadInvitationId)

    const membershipIds = uniqueNumbers(
      [leadMembershipId, ...supportingMembershipIds].filter((id): id is number => id !== undefined)
    )
    if (membershipIds.length > 0) {
      const memberships = await Membership.query({ client: trx })
        .whereIn('id', membershipIds)
        .where('schoolId', school.id)
        .preload('roles')

      if (
        memberships.length !== membershipIds.length ||
        !memberships.every((membership) => hasInstructorRole(membership))
      ) {
        throw new ClassAuthoringException('Choose Teachers or Head Coaches from this school.')
      }
    }

    const invitationIds = uniqueNumbers(
      [leadInvitationId, ...supportingInvitationIds].filter((id): id is number => id !== undefined)
    )
    if (invitationIds.length > 0) {
      const invitations = await Invitation.query({ client: trx })
        .whereIn('id', invitationIds)
        .where('schoolId', school.id)
        .whereHas('role', (roleQuery) =>
          roleQuery.whereIn('name', [RoleName.TEACHER, RoleName.ASSISTANT_COACH])
        )
        .whereNull('acceptedAt')

      if (invitations.length !== invitationIds.length) {
        throw new ClassAuthoringException(
          'Choose pending Teacher or Assistant Coach invitations from this school.'
        )
      }
    }

    const assignments: InstructorAssignment[] = [
      ...(leadMembershipId
        ? [{ role: ClassInstructorRole.LEAD, membershipId: leadMembershipId, invitationId: null }]
        : []),
      ...(leadInvitationId
        ? [{ role: ClassInstructorRole.LEAD, membershipId: null, invitationId: leadInvitationId }]
        : []),
      ...supportingMembershipIds.map((membershipId) => ({
        role: ClassInstructorRole.SUPPORTING,
        membershipId,
        invitationId: null,
      })),
      ...supportingInvitationIds.map((invitationId) => ({
        role: ClassInstructorRole.SUPPORTING,
        membershipId: null,
        invitationId,
      })),
    ]

    const hasInviteInput =
      data.inviteTeacherEmail ||
      data.inviteTeacherFirstName ||
      data.inviteTeacherLastName ||
      data.inviteTeacherPhone ||
      (data.inviteTeacherCertifications?.length ?? 0) > 0
    if (!hasInviteInput) {
      return { assignments }
    }

    if (
      !data.inviteTeacherEmail ||
      !data.inviteTeacherFirstName ||
      !data.inviteTeacherLastName ||
      !data.inviteTeacherPhone
    ) {
      throw new ClassAuthoringException(
        'Teacher first name, last name, phone, and email are required.'
      )
    }

    const teacherRole = await Role.findByOrFail('name', RoleName.TEACHER, { client: trx })
    const invitation = await Invitation.updateOrCreate(
      { schoolId: school.id, email: data.inviteTeacherEmail },
      {
        roleId: teacherRole.id,
        inviteeFirstName: data.inviteTeacherFirstName,
        inviteeLastName: data.inviteTeacherLastName,
        inviteePhone: data.inviteTeacherPhone,
        certifications: data.inviteTeacherCertifications ?? null,
        token: string.random(48),
        expiresAt: DateTime.now().plus({ days: 7 }),
        acceptedAt: null,
      },
      { client: trx }
    )

    if (!assignments.some((assignment) => assignment.invitationId === invitation.id)) {
      assignments.push({
        role: ClassInstructorRole.SUPPORTING,
        membershipId: null,
        invitationId: invitation.id,
      })
    }
    return { assignments, newInvitation: invitation }
  }

  /** Send the newly created teacher invitation once the transaction commits. */
  protected queueInvitationMail(
    resolved: ResolvedInstructors,
    school: School,
    trx: TransactionClientContract
  ): void {
    const invitation = resolved.newInvitation
    if (!invitation) {
      return
    }
    trx.after('commit', async () => {
      await mail.sendLater(
        new InvitationMail(invitation.email, invitation.token, school.name, RoleName.TEACHER)
      )
    })
  }
}
