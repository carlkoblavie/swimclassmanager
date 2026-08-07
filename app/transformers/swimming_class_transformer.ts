import { BaseTransformer } from '@adonisjs/core/transformers'
import { DateTime } from 'luxon'
import type ClassInstructor from '#models/class_instructor'
import type ClassLesson from '#models/class_lesson'
import type ClassSkill from '#models/class_skill'
import type Invitation from '#models/invitation'
import type LessonActivity from '#models/lesson_activity'
import type Level from '#models/level'
import type LevelStage from '#models/level_stage'
import type LevelStageActivity from '#models/level_stage_activity'
import type Membership from '#models/membership'
import type Program from '#models/program'
import type SchoolActivity from '#models/school_activity'
import type SchoolActivityCategory from '#models/school_activity_category'
import type SwimYear from '#models/swim_year'
import type SwimmingClass from '#models/swimming_class'
import type Term from '#models/term'
import type User from '#models/user'
import { ClassInstructorRole } from '#values/class_instructor_role'

type TransformedLessonActivity = {
  id: number
  schoolActivityId: number | null
  levelStageActivityId: number | null
  skillId: number | null
  categoryName: string | null
  name: string
  description: string | null
  durationMinutes: number | null
  ledBy: number | null
  successCue: string | null
  position: number
}

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
      classInstructors?: ClassInstructor[]
      classSkills?: ClassSkill[]
      lessons?: ClassLesson[]
      term?: Term
    }
    const level = preloaded.level
    const levelPreloaded = level?.$preloaded as { program?: Program } | undefined
    const program = levelPreloaded?.program
    const stage = preloaded.levelStage
    const classInstructors = preloaded.classInstructors ?? []
    const classSkills = preloaded.classSkills ?? []
    const lessons = (preloaded.lessons ?? []).toSorted(
      (a, b) => a.date.toMillis() - b.date.toMillis()
    )

    const instructors = classInstructors.map((classInstructor) => {
      const instructorPreloaded = classInstructor.$preloaded as {
        membership?: Membership
        invitation?: Invitation
      }
      const membership = instructorPreloaded.membership
      const invitation = instructorPreloaded.invitation
      const membershipPreloaded = membership?.$preloaded as { user?: User } | undefined
      const user = membershipPreloaded?.user ?? membership?.user

      if (membership) {
        return {
          type: 'membership' as const,
          id: membership.id,
          role: classInstructor.role,
          status: 'active' as const,
          label: user?.fullName?.trim() || user?.email || 'Assigned instructor',
        }
      }
      return {
        type: 'invitation' as const,
        id: invitation?.id ?? classInstructor.invitationId ?? 0,
        role: classInstructor.role,
        status: 'pending' as const,
        label: invitation?.inviteeFullName || invitation?.email || 'Pending instructor',
      }
    })
    const leadInstructor =
      instructors.find((instructor) => instructor.role === ClassInstructorRole.LEAD) ?? null
    const supportingInstructors = instructors.filter(
      (instructor) => instructor.role === ClassInstructorRole.SUPPORTING
    )

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
      ]),
      weekdayName: this.resource.weekday
        ? (WEEKDAY_NAMES[this.resource.weekday] ?? String(this.resource.weekday))
        : null,
      startTime: this.resource.startTime
        ? {
            raw: this.resource.startTime,
            formatted: formatTime(this.resource.startTime),
          }
        : null,
      isCancelled: this.resource.isCancelled,
      level: level
        ? {
            id: level.id,
            programId: level.programId,
            name: level.name,
            capacity: level.capacity,
            programName: program?.name ?? '',
          }
        : undefined,
      // The level's curriculum length caps how many lessons a class may plan.
      lessonAllowance: level?.classesCount ?? null,
      stage: stage
        ? {
            id: stage.id,
            code: stage.code,
            name: stage.name,
            skills: (stage.skills ?? []).map((skill) => ({
              id: skill.id,
              name: skill.name,
              passCriteria: skill.passCriteria,
              activities: (skill.activities ?? []).map((activity) => ({
                id: activity.id,
                name: activity.name,
              })),
            })),
          }
        : undefined,
      term: (() => {
        const term = preloaded.term
        if (!term) {
          return undefined
        }
        const termPreloaded = term.$preloaded as { swimYear?: SwimYear } | undefined
        return {
          id: term.id,
          name: term.name,
          swimYearName: termPreloaded?.swimYear?.name ?? '',
          startsOn: {
            raw: term.startsOn.toISODate() ?? '',
            formatted: term.startsOn.toFormat('d LLL yyyy'),
          },
          endsOn: {
            raw: term.endsOn.toISODate() ?? '',
            formatted: term.endsOn.toFormat('d LLL yyyy'),
          },
        }
      })(),
      instructors,
      leadInstructor,
      supportingInstructors,
      skills: classSkills.flatMap((classSkill) => {
        const skill = classSkill.skillBankSkill ?? classSkill.levelStageSkill
        if (!skill) {
          return []
        }
        return [
          {
            id: skill.id,
            name: skill.name,
            passCriteria: skill.passCriteria,
            activities:
              'activities' in skill && Array.isArray(skill.activities)
                ? skill.activities.map((activity) => ({
                    id: activity.id,
                    name: activity.name,
                  }))
                : [],
          },
        ]
      }),
      lessons: lessons.map((lesson) => {
        const lessonPreloaded = lesson.$preloaded as { lessonActivities?: LessonActivity[] }
        const lessonActivities = lessonPreloaded.lessonActivities ?? []

        return {
          id: lesson.id,
          date: {
            raw: lesson.date.toISODate() ?? '',
            formatted: lesson.date.toFormat('cccc d LLL yyyy'),
          },
          objectives: lesson.objectives,
          notes: lesson.notes,
          observation: lesson.observation,
          concludedAt: lesson.concludedAt
            ? {
                raw: lesson.concludedAt.toISO(),
                formatted: lesson.concludedAt.toFormat('d LLL yyyy, h:mm a'),
              }
            : null,
          isConcluded: lesson.concludedAt !== null,
          activities: lessonActivities.flatMap((lessonActivity): TransformedLessonActivity[] => {
            const activityPreloaded = lessonActivity.$preloaded as {
              schoolActivity?: SchoolActivity
              levelStageActivity?: LevelStageActivity
            }
            const schoolActivity = activityPreloaded.schoolActivity
            const categoryPreloaded = schoolActivity?.$preloaded as
              | { category?: SchoolActivityCategory }
              | undefined
            if (schoolActivity || lessonActivity.schoolActivityId) {
              return [
                {
                  id: lessonActivity.id,
                  schoolActivityId: lessonActivity.schoolActivityId,
                  levelStageActivityId: null,
                  skillId: null,
                  categoryName:
                    lessonActivity.categoryName ??
                    categoryPreloaded?.category?.name ??
                    'Activity Bank',
                  name:
                    lessonActivity.activityName ??
                    schoolActivity?.name ??
                    'Removed activity bank item',
                  description:
                    lessonActivity.activityDescription ?? schoolActivity?.description ?? null,
                  durationMinutes:
                    lessonActivity.durationMinutes ?? schoolActivity?.durationMinutes ?? null,
                  ledBy: lessonActivity.ledBy ?? schoolActivity?.ledBy ?? null,
                  successCue: lessonActivity.successCue ?? schoolActivity?.successCue ?? null,
                  position: lessonActivity.position,
                },
              ]
            }
            const activity = lessonActivity.levelStageActivity
            if (!activity) {
              return []
            }
            return [
              {
                id: lessonActivity.id,
                schoolActivityId: null,
                levelStageActivityId: activity.id,
                name: activity.name,
                description: activity.description,
                categoryName: null,
                durationMinutes: null,
                ledBy: null,
                successCue: null,
                skillId: activity.levelStageSkillId,
                position: lessonActivity.position,
              },
            ]
          }),
        }
      }),
    }
  }
}
