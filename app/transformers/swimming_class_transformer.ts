import { BaseTransformer } from '@adonisjs/core/transformers'
import type ClassStage from '#models/class_stage'
import type Invitation from '#models/invitation'
import type Level from '#models/level'
import type Membership from '#models/membership'
import type Program from '#models/program'
import type Skill from '#models/skill'
import type SwimmingClass from '#models/swimming_class'
import type SwimmingClassSession from '#models/swimming_class_session'
import type User from '#models/user'

function formatDate(value: { toISODate(): string | null; toFormat(format: string): string }) {
  return {
    raw: value.toISODate() ?? '',
    formatted: value.toFormat('dd LLL yyyy'),
  }
}

function formatDateTime(value: { toISO(): string | null; toFormat(format: string): string }) {
  return {
    raw: value.toISO() ?? '',
    formatted: value.toFormat('dd LLL yyyy, HH:mm'),
  }
}

export default class SwimmingClassTransformer extends BaseTransformer<SwimmingClass> {
  toObject() {
    const preloaded = this.resource.$preloaded as {
      level?: Level
      instructorMembership?: Membership
      pendingInstructorInvitation?: Invitation
      stages?: ClassStage[]
      sessions?: SwimmingClassSession[]
    }
    const level = preloaded.level
    const levelPreloaded = level?.$preloaded as { program?: Program } | undefined
    const program = levelPreloaded?.program
    const instructorMembership = preloaded.instructorMembership
    const membershipPreloaded = instructorMembership?.$preloaded as { user?: User } | undefined
    const instructorUser = membershipPreloaded?.user ?? instructorMembership?.user
    const pendingInvitation = preloaded.pendingInstructorInvitation
    const stages = (preloaded.stages ?? []).toSorted((a, b) => a.position - b.position)
    const sessions = (preloaded.sessions ?? []).toSorted(
      (a, b) => a.startsAt.toMillis() - b.startsAt.toMillis()
    )

    const activeInstructorLabel =
      instructorUser?.fullName?.trim() || instructorUser?.email || 'Assigned instructor'
    const pendingInstructorLabel =
      pendingInvitation?.inviteeName?.trim() || pendingInvitation?.email || 'Pending instructor'

    return {
      ...this.pick(this.resource, [
        'id',
        'schoolId',
        'levelId',
        'code',
        'name',
        'capacity',
        'location',
        'startTime',
        'endTime',
        'instructorMembershipId',
        'pendingInstructorInvitationId',
      ]),
      dateRange: {
        start: formatDate(this.resource.startDate),
        end: formatDate(this.resource.endDate),
      },
      isCancelled: this.resource.isCancelled,
      level: level
        ? {
            id: level.id,
            name: level.name,
            capacity: level.capacity,
            programName: program?.name ?? '',
          }
        : undefined,
      instructor: {
        status: pendingInvitation ? ('pending' as const) : ('active' as const),
        label: pendingInvitation ? pendingInstructorLabel : activeInstructorLabel,
      },
      stages: stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        position: stage.position,
        skills: ((stage.skills ?? []) as unknown as Skill[]).map((skill) => ({
          id: skill.id,
          name: skill.name,
          scope: skill.isDefault ? ('platform' as const) : ('school' as const),
        })),
      })),
      sessions: sessions.map((session) => ({
        id: session.id,
        startsAt: formatDateTime(session.startsAt),
        endsAt: formatDateTime(session.endsAt),
        isCancelled: session.isCancelled,
      })),
    }
  }
}
