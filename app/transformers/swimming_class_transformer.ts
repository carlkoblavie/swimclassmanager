import { BaseTransformer } from '@adonisjs/core/transformers'
import { DateTime } from 'luxon'
import type ClassActivity from '#models/class_activity'
import type ClassSkill from '#models/class_skill'
import type Invitation from '#models/invitation'
import type Level from '#models/level'
import type LevelStage from '#models/level_stage'
import type Membership from '#models/membership'
import type Program from '#models/program'
import type SwimmingClass from '#models/swimming_class'
import type User from '#models/user'

export const WEEKDAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
}

function formatTime(value: string): string {
  const parsed = DateTime.fromFormat(value, 'HH:mm')
  return parsed.isValid ? parsed.toFormat('h:mm a') : value
}

export default class SwimmingClassTransformer extends BaseTransformer<SwimmingClass> {
  toObject() {
    const preloaded = this.resource.$preloaded as {
      level?: Level
      levelStage?: LevelStage
      instructorMembership?: Membership
      pendingInstructorInvitation?: Invitation
      classSkills?: ClassSkill[]
      classActivities?: ClassActivity[]
    }
    const level = preloaded.level
    const levelPreloaded = level?.$preloaded as { program?: Program } | undefined
    const program = levelPreloaded?.program
    const stage = preloaded.levelStage
    const instructorMembership = preloaded.instructorMembership
    const membershipPreloaded = instructorMembership?.$preloaded as { user?: User } | undefined
    const instructorUser = membershipPreloaded?.user ?? instructorMembership?.user
    const pendingInvitation = preloaded.pendingInstructorInvitation
    const classSkills = preloaded.classSkills ?? []
    const classActivities = preloaded.classActivities ?? []

    const activeInstructorLabel =
      instructorUser?.fullName?.trim() || instructorUser?.email || 'Assigned instructor'
    const pendingInstructorLabel =
      pendingInvitation?.inviteeName?.trim() || pendingInvitation?.email || 'Pending instructor'
    const hasInstructor =
      this.resource.instructorMembershipId !== null ||
      this.resource.pendingInstructorInvitationId !== null

    return {
      ...this.pick(this.resource, [
        'id',
        'schoolId',
        'levelId',
        'levelStageId',
        'code',
        'name',
        'location',
        'weekday',
        'durationMinutes',
        'instructorMembershipId',
        'pendingInstructorInvitationId',
      ]),
      weekdayName: WEEKDAY_NAMES[this.resource.weekday] ?? String(this.resource.weekday),
      startTime: {
        raw: this.resource.startTime,
        formatted: formatTime(this.resource.startTime),
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
      stage: stage ? { id: stage.id, code: stage.code, name: stage.name } : undefined,
      instructor: hasInstructor
        ? {
            status: pendingInvitation ? ('pending' as const) : ('active' as const),
            label: pendingInvitation ? pendingInstructorLabel : activeInstructorLabel,
          }
        : undefined,
      skills: classSkills.flatMap((classSkill) => {
        const skill = classSkill.levelStageSkill
        if (!skill) {
          return []
        }
        return [
          {
            id: skill.id,
            name: skill.name,
            passCriteria: skill.passCriteria,
          },
        ]
      }),
      activities: classActivities.flatMap((classActivity) => {
        const activity = classActivity.levelStageActivity
        if (!activity) {
          return []
        }
        return [
          {
            id: activity.id,
            name: activity.name,
            skillId: activity.levelStageSkillId,
          },
        ]
      }),
    }
  }
}
