import string from '@adonisjs/core/helpers/string'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'
import ClassAuthoringException from '#exceptions/class_authoring_exception'
import InvitationMail from '#mails/invitation'
import Invitation from '#models/invitation'
import Level from '#models/level'
import type LevelStage from '#models/level_stage'
import LevelStageActivity from '#models/level_stage_activity'
import LevelStageSkill from '#models/level_stage_skill'
import Membership from '#models/membership'
import Role from '#models/role'
import SchoolActivity from '#models/school_activity'
import SchoolActivityCategory from '#models/school_activity_category'
import SkillBankSkill from '#models/skill_bank_skill'
import type School from '#models/school'
import SwimmingClass from '#models/swimming_class'
import ClassInstructor from '#models/class_instructor'
import ClassLesson from '#models/class_lesson'
import ClassSkill from '#models/class_skill'
import LessonActivity from '#models/lesson_activity'
import LessonInstructor from '#models/lesson_instructor'
import Term from '#models/term'
import ClassLessonCapacityService from '#services/class_lesson_capacity_service'
import {
  ClassInstructorRole,
  type ClassInstructorRole as ClassInstructorRoleValue,
} from '#values/class_instructor_role'
import { LessonActivityLeader } from '#values/lesson_activity_leader'
import { RoleName } from '#values/role'
import { classCode, codeSegment, nextTierNumber } from '#values/account_code'
import {
  type StoreClassLessonInput,
  type GenerateClassLessonsInput,
  type StoreSwimmingClassesInput,
  type UpdateSwimmingClassInput,
  type UpdateLessonActivitiesInput,
} from '#validators/swimming_class'

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

function serializeEquipment(values: string[] | undefined): string | null {
  const equipment = [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))]
  return equipment.length > 0 ? JSON.stringify(equipment) : null
}

function serializeAssessmentGoals(values: string[]): string {
  const goals = values.map((value) => value.trim()).filter(Boolean)
  if (goals.length === 0) {
    throw new ClassAuthoringException('Add at least one assessment goal.')
  }
  return JSON.stringify(goals)
}

type InstructorSelection = Pick<
  UpdateSwimmingClassInput,
  | 'leadInstructorMembershipId'
  | 'leadInstructorInvitationId'
  | 'supportingInstructorMembershipIds'
  | 'supportingInstructorInvitationIds'
  | 'instructorMembershipIds'
  | 'instructorInvitationIds'
  | 'inviteTeacherEmail'
  | 'inviteTeacherFirstName'
  | 'inviteTeacherLastName'
  | 'inviteTeacherPhone'
  | 'inviteTeacherCertifications'
> & {
  date?: DateTime
  durationMinutes?: number
}

type InstructorAssignment = {
  role: ClassInstructorRoleValue
  membershipId: number | null
  invitationId: number | null
}

type ResolvedInstructors = {
  assignments: InstructorAssignment[]
  newInvitation?: Invitation
}

type CurriculumSelection = {
  stage: LevelStage
  skillIds: number[]
  skills: {
    skillBankSkillId: number
    levelStageSkillId: number | null
  }[]
}

type SchoolLessonActivitySelection = {
  activity: SchoolActivity
  durationMinutes: number
  ledBy: number
}

type CustomSchoolActivitySelection = {
  activity: SchoolActivity
  durationMinutes: number
  ledBy: number
}

export default class ClassSeriesAuthoringService {
  protected lessonCapacity = new ClassLessonCapacityService()

  /**
   * Create a single class under an available level. The class carries its
   * stage, skills, and a lesson duration; scheduling (days, times, and the
   * dated lessons) happens later, separately.
   */
  async createOne(school: School, data: StoreSwimmingClassesInput): Promise<SwimmingClass> {
    return db.transaction(async (trx) => {
      const level = await this.loadAvailableLevel(school, data.levelId, trx)
      const term = await this.loadTerm(school, data.termId, trx)
      const instructors = await this.resolveInstructors(school, data, trx)

      const selection = await this.resolveClassCurriculum(school, level, data, trx)
      const prerequisiteStageId = this.resolvePrerequisiteStageId(
        level,
        data.prerequisiteStageId,
        selection.stage.id
      )
      const name = data.name?.trim() || this.generatedClassName(level, selection.stage)
      await this.assertNameAvailable(school, name, selection.stage.id, trx)

      const existingCodeRows = await SwimmingClass.query({ client: trx }).select('code')
      const existingCodes = existingCodeRows.map((row) => row.code)
      const code = classCode(selection.stage.code, nextTierNumber(existingCodes, 'class'))

      const swimmingClass = new SwimmingClass()
      swimmingClass.useTransaction(trx)
      swimmingClass.merge({
        schoolId: school.id,
        levelId: level.id,
        levelStageId: selection.stage.id,
        termId: term.id,
        name,
        aim: data.aim,
        assessmentGoals: serializeAssessmentGoals(data.assessmentGoals),
        prerequisiteStageId,
        code,
        durationMinutes: data.durationMinutes,
        location: null,
        maxLessons: data.maxLessons,
      })
      await swimmingClass.save()
      await this.syncInstructors(swimmingClass, instructors, trx)
      await swimmingClass.related('classSkills').createMany(selection.skills)

      this.queueInvitationMail(instructors, school, trx)

      return swimmingClass
    })
  }

  /**
   * Duplicate a class into the same stage, copying its skills and instructors.
   * The copy gets its own code and a distinct name.
   */
  async duplicate(swimmingClass: SwimmingClass, school: School): Promise<SwimmingClass> {
    return db.transaction(async (trx) => {
      const level = await this.loadAvailableLevel(school, swimmingClass.levelId, trx)
      const stage = level.stages.find((candidate) => candidate.id === swimmingClass.levelStageId)
      if (!stage) {
        throw new ClassAuthoringException('This class’s stage no longer exists.')
      }

      const sourceSkills = await ClassSkill.query({ client: trx }).where(
        'swimmingClassId',
        swimmingClass.id
      )
      const sourceInstructors = await ClassInstructor.query({ client: trx }).where(
        'swimmingClassId',
        swimmingClass.id
      )

      const name = await this.availableCopyName(
        school,
        `${swimmingClass.name} (copy)`,
        swimmingClass.levelStageId,
        trx
      )
      const existingCodeRows = await SwimmingClass.query({ client: trx }).select('code')
      const existingCodes = existingCodeRows.map((row) => row.code)
      const code = classCode(stage.code, nextTierNumber(existingCodes, 'class'))

      const copy = new SwimmingClass()
      copy.useTransaction(trx)
      copy.merge({
        schoolId: school.id,
        levelId: swimmingClass.levelId,
        levelStageId: swimmingClass.levelStageId,
        termId: swimmingClass.termId,
        name,
        aim: swimmingClass.aim,
        assessmentGoals: swimmingClass.assessmentGoals,
        prerequisiteStageId: swimmingClass.prerequisiteStageId,
        code,
        durationMinutes: swimmingClass.durationMinutes,
        location: swimmingClass.location,
      })
      await copy.save()

      if (sourceSkills.length > 0) {
        await copy.related('classSkills').createMany(
          sourceSkills.map((skill) => ({
            skillBankSkillId: skill.skillBankSkillId,
            levelStageSkillId: skill.levelStageSkillId,
          }))
        )
      }
      if (sourceInstructors.length > 0) {
        await copy.related('classInstructors').createMany(
          sourceInstructors.map((instructor) => ({
            role: instructor.role,
            membershipId: instructor.membershipId,
            invitationId: instructor.invitationId,
          }))
        )
      }

      return copy
    })
  }

  protected generatedClassName(level: Level, stage: LevelStage): string {
    return `${level.name} · ${stage.name}`
  }

  protected async availableCopyName(
    school: School,
    base: string,
    levelStageId: number,
    trx: TransactionClientContract
  ): Promise<string> {
    let name = base
    let suffix = 2
    while (
      await SwimmingClass.query({ client: trx })
        .where('schoolId', school.id)
        .where('levelStageId', levelStageId)
        .whereRaw('lower(name) = ?', [name.trim().toLowerCase()])
        .first()
    ) {
      name = `${base} ${suffix++}`
    }
    return name
  }

  /**
   * Update one class: schedule, name, location, instructor, and its
   * stage/skills. Changing curriculum is refused while lessons use
   * activities outside the new skill set.
   */
  async update(
    swimmingClass: SwimmingClass,
    school: School,
    data: UpdateSwimmingClassInput
  ): Promise<SwimmingClass> {
    return db.transaction(async (trx) => {
      const level = await this.loadAvailableLevel(school, swimmingClass.levelId, trx)

      const selection = await this.resolveClassCurriculum(school, level, data, trx)
      const prerequisiteStageId = this.resolvePrerequisiteStageId(
        level,
        data.prerequisiteStageId,
        selection.stage.id
      )
      const name = data.name?.trim() || this.generatedClassName(level, selection.stage)
      await this.assertNameAvailable(school, name, selection.stage.id, trx, swimmingClass.id)
      const instructors = await this.resolveInstructors(school, data, trx)

      let termId = swimmingClass.termId
      if (data.termId !== undefined && data.termId !== termId) {
        const term = await this.loadTerm(school, data.termId, trx)
        termId = term.id
      }

      await this.assertLessonActivitiesCovered(swimmingClass, selection, trx)

      // Codes are strictly system-generated: the class keeps its own CL
      // number, but the parent segment follows the class to its new stage.
      let code = swimmingClass.code
      if (selection.stage.id !== swimmingClass.levelStageId) {
        const parent = codeSegment(selection.stage.code, 'stage') ?? selection.stage.code
        const own = codeSegment(swimmingClass.code, 'class')
        code = own ? `${parent}${own}` : swimmingClass.code
      }

      swimmingClass.useTransaction(trx)
      swimmingClass.merge({
        levelStageId: selection.stage.id,
        termId,
        name,
        aim: data.aim,
        assessmentGoals: serializeAssessmentGoals(data.assessmentGoals),
        prerequisiteStageId,
        code,
        durationMinutes: data.durationMinutes,
        location: data.location ?? null,
        maxLessons: data.maxLessons,
      })
      await swimmingClass.save()

      await this.syncInstructors(swimmingClass, instructors, trx)

      await ClassSkill.query({ client: trx }).where('swimmingClassId', swimmingClass.id).delete()
      await swimmingClass.related('classSkills').createMany(selection.skills)

      this.queueInvitationMail(instructors, school, trx)

      return swimmingClass
    })
  }

  /**
   * Plan the class's next lesson: dates are system-appended on the class's
   * weekday after the last planned lesson; the payload carries only that
   * week's activities, drawn from the class's skills.
   */
  async planLesson(
    swimmingClass: SwimmingClass,
    data: StoreClassLessonInput
  ): Promise<ClassLesson> {
    return db.transaction(async (trx) => {
      const legacyActivityIds = await this.resolveLessonActivities(
        swimmingClass,
        data.activityIds ?? [],
        trx
      )
      const customActivities = await this.resolveCustomSchoolActivities(swimmingClass, data, trx)
      const schoolActivities = await this.resolveSchoolActivities(
        swimmingClass,
        [
          ...(data.schoolActivityIds ?? []),
          ...customActivities.map((selection) => selection.activity.id),
        ],
        [
          ...(data.schoolActivityDurations ?? []),
          ...customActivities.map((selection) => selection.durationMinutes),
        ],
        [
          ...(data.schoolActivityLedBys ?? []),
          ...customActivities.map((selection) => selection.ledBy),
        ],
        trx
      )
      this.assertConclusionObservation(data)

      // Check class-level lesson limit
      const classLessonCount = await ClassLesson.query({ client: trx })
        .where('swimmingClassId', swimmingClass.id)
        .count('* as total')
        .first()
      const count = Number(classLessonCount?.$extras.total ?? 0)
      if (count >= swimmingClass.maxLessons) {
        throw new ClassAuthoringException(
          `This class already has all ${swimmingClass.maxLessons} ${swimmingClass.maxLessons === 1 ? 'lesson' : 'lessons'} it allows.`
        )
      }

      // The level's curriculum length is shared by every class in the level.
      const level = await Level.findOrFail(swimmingClass.levelId, { client: trx })
      if (level.classesCount !== null) {
        const levelLessonCount = await this.lessonCapacity.countForLevel(
          swimmingClass.schoolId,
          swimmingClass.levelId,
          trx
        )
        if (levelLessonCount >= level.classesCount) {
          throw new ClassAuthoringException(
            `This level already has all ${level.classesCount} ${level.classesCount === 1 ? 'lesson' : 'lessons'} it allows.`
          )
        }
      }

      const latest = await ClassLesson.query({ client: trx })
        .where('swimmingClassId', swimmingClass.id)
        .orderBy('date', 'desc')
        .first()
      const weekday = swimmingClass.weekday
      if (weekday === null) {
        throw new ClassAuthoringException('Set this class’s schedule before planning lessons.')
      }
      const date = this.nextLessonDate(weekday, latest?.date ?? null)

      if (swimmingClass.termId) {
        const term = await Term.findOrFail(swimmingClass.termId, { client: trx })
        this.assertDateWithinTerm(date, term)
      }

      swimmingClass.useTransaction(trx)
      const lesson = await swimmingClass.related('lessons').create({
        date,
        objectives: data.objectives,
        equipment: serializeEquipment(data.equipment),
        notes: data.notes ?? null,
        observation: data.observation ?? null,
        concludedAt: data.intent === 'conclude' ? DateTime.now() : null,
      })
      await this.syncLessonActivities(lesson, legacyActivityIds, schoolActivities)
      await this.inheritClassInstructors(lesson, swimmingClass, trx)
      return lesson
    })
  }

  /**
   * Generate empty dated lessons for a class across a scheduling window.
   * The class records the latest selected time/weekday for compatibility with
   * older class displays, but the lesson dates are the actual schedule.
   */
  async generateLessons(
    swimmingClass: SwimmingClass,
    data: GenerateClassLessonsInput
  ): Promise<ClassLesson[]> {
    return db.transaction(async (trx) => {
      const level = await Level.findOrFail(swimmingClass.levelId, { client: trx })
      const existingLessons = await ClassLesson.query({ client: trx })
        .where('swimmingClassId', swimmingClass.id)
        .select('date')

      const existingDates = new Set(
        existingLessons.map((lesson) => lesson.date.toISODate()).filter(Boolean) as string[]
      )
      const dates = this.lessonDatesInWindow(data.startDate, data.endDate, data.weekdays).filter(
        (date) => !existingDates.has(date.toISODate()!)
      )

      if (swimmingClass.termId) {
        const term = await Term.findOrFail(swimmingClass.termId, { client: trx })
        for (const date of dates) {
          this.assertDateWithinTerm(date, term)
        }
      }

      // Check class-level lesson limit
      const currentCount = existingLessons.length
      if (currentCount + dates.length > swimmingClass.maxLessons) {
        throw new ClassAuthoringException(
          `This class can only have ${swimmingClass.maxLessons} ${swimmingClass.maxLessons === 1 ? 'lesson' : 'lessons'}. You're trying to add ${dates.length} more, but only ${swimmingClass.maxLessons - currentCount} ${swimmingClass.maxLessons - currentCount === 1 ? 'slot' : 'slots'} remaining.`
        )
      }

      if (level.classesCount !== null) {
        const levelLessonCount = await this.lessonCapacity.countForLevel(
          swimmingClass.schoolId,
          swimmingClass.levelId,
          trx
        )
        if (levelLessonCount + dates.length > level.classesCount) {
          throw new ClassAuthoringException(
            `This level can only have ${level.classesCount} ${level.classesCount === 1 ? 'lesson' : 'lessons'}.`
          )
        }
      }

      swimmingClass.useTransaction(trx)
      swimmingClass.weekday = data.weekdays[0]
      swimmingClass.startTime = data.startTime
      await swimmingClass.save()

      const lessons: ClassLesson[] = []
      for (const date of dates) {
        const lesson = await swimmingClass.related('lessons').create({
          date,
          objectives: null,
          notes: null,
          observation: null,
          concludedAt: null,
        })
        await this.inheritClassInstructors(lesson, swimmingClass, trx)
        lessons.push(lesson)
      }

      return lessons
    })
  }

  protected lessonDatesInWindow(
    startDate: DateTime,
    endDate: DateTime,
    weekdays: number[]
  ): DateTime[] {
    const allowedWeekdays = new Set(weekdays)
    let cursor = startDate.startOf('day')
    const end = endDate.startOf('day')
    const dates: DateTime[] = []

    while (cursor <= end) {
      if (allowedWeekdays.has(cursor.weekday)) {
        dates.push(cursor)
      }
      cursor = cursor.plus({ days: 1 })
    }

    return dates
  }

  /** The next occurrence of the class weekday strictly after the anchor. */
  protected nextLessonDate(weekday: number, latest: DateTime | null): DateTime {
    const today = DateTime.now().startOf('day')
    let anchor = latest && latest > today ? latest : today
    let candidate = anchor.plus({ days: 1 })
    while (candidate.weekday !== weekday) {
      candidate = candidate.plus({ days: 1 })
    }
    return candidate
  }

  /**
   * Update a planned lesson's activities and notes; its system-assigned
   * date is immutable.
   */
  async updateLesson(lesson: ClassLesson, data: StoreClassLessonInput): Promise<ClassLesson> {
    return db.transaction(async (trx) => {
      const swimmingClass = await SwimmingClass.findOrFail(lesson.swimmingClassId, { client: trx })
      const legacyActivityIds = await this.resolveLessonActivities(
        swimmingClass,
        data.activityIds ?? [],
        trx
      )
      const customActivities = await this.resolveCustomSchoolActivities(swimmingClass, data, trx)
      const schoolActivities = await this.resolveSchoolActivities(
        swimmingClass,
        [
          ...(data.schoolActivityIds ?? []),
          ...customActivities.map((selection) => selection.activity.id),
        ],
        [
          ...(data.schoolActivityDurations ?? []),
          ...customActivities.map((selection) => selection.durationMinutes),
        ],
        [
          ...(data.schoolActivityLedBys ?? []),
          ...customActivities.map((selection) => selection.ledBy),
        ],
        trx
      )
      this.assertConclusionObservation(data)

      lesson.useTransaction(trx)
      lesson.objectives = data.objectives
      lesson.equipment = serializeEquipment(data.equipment)
      lesson.notes = data.notes ?? null
      lesson.observation = data.observation ?? null
      lesson.concludedAt =
        data.intent === 'conclude' ? (lesson.concludedAt ?? DateTime.now()) : null
      await lesson.save()

      await LessonActivity.query({ client: trx }).where('classLessonId', lesson.id).delete()
      await this.syncLessonActivities(lesson, legacyActivityIds, schoolActivities)
      return lesson
    })
  }

  async updateLessonActivities(
    lesson: ClassLesson,
    data: UpdateLessonActivitiesInput
  ): Promise<ClassLesson> {
    return db.transaction(async (trx) => {
      const swimmingClass = await SwimmingClass.findOrFail(lesson.swimmingClassId, { client: trx })
      const legacyActivityIds = await this.resolveLessonActivities(
        swimmingClass,
        data.activityIds ?? [],
        trx
      )
      const customActivities = await this.resolveCustomSchoolActivities(swimmingClass, data, trx)
      const schoolActivities = await this.resolveSchoolActivities(
        swimmingClass,
        [
          ...(data.schoolActivityIds ?? []),
          ...customActivities.map((selection) => selection.activity.id),
        ],
        [
          ...(data.schoolActivityDurations ?? []),
          ...customActivities.map((selection) => selection.durationMinutes),
        ],
        [
          ...(data.schoolActivityLedBys ?? []),
          ...customActivities.map((selection) => selection.ledBy),
        ],
        trx
      )

      lesson.useTransaction(trx)
      await LessonActivity.query({ client: trx }).where('classLessonId', lesson.id).delete()
      await this.syncLessonActivities(lesson, legacyActivityIds, schoolActivities)
      return lesson
    })
  }

  async assignLessonInstructors(
    lesson: ClassLesson,
    school: School,
    data: InstructorSelection
  ): Promise<void> {
    await db.transaction(async (trx) => {
      const swimmingClass = await SwimmingClass.findOrFail(lesson.swimmingClassId, { client: trx })
      const instructors = await this.resolveInstructors(school, data, trx)

      if (data.date) {
        if (swimmingClass.termId) {
          const term = await Term.findOrFail(swimmingClass.termId, { client: trx })
          this.assertDateWithinTerm(data.date, term)
        }

        const dateAlreadyUsed = await ClassLesson.query({ client: trx })
          .where('swimmingClassId', swimmingClass.id)
          .whereNot('id', lesson.id)
          .where('date', data.date.toISODate()!)
          .first()
        if (dateAlreadyUsed) {
          throw new ClassAuthoringException('This class already has a lesson on that date.')
        }
      }

      await LessonInstructor.query({ client: trx }).where('classLessonId', lesson.id).delete()
      lesson.useTransaction(trx)
      if (data.date) {
        lesson.date = data.date
      }
      if (data.durationMinutes !== undefined) {
        lesson.durationMinutes = data.durationMinutes
      }
      await lesson.save()
      await lesson.related('lessonInstructors').createMany(instructors.assignments)
    })
  }

  async bulkAssignLessonInstructors(
    lessons: ClassLesson[],
    school: School,
    data: InstructorSelection
  ): Promise<void> {
    await db.transaction(async (trx) => {
      const instructors = await this.resolveInstructors(school, data, trx)

      for (const lesson of lessons) {
        await LessonInstructor.query({ client: trx }).where('classLessonId', lesson.id).delete()
        lesson.useTransaction(trx)
        await lesson.related('lessonInstructors').createMany(instructors.assignments)
      }
    })
  }

  protected async inheritClassInstructors(
    lesson: ClassLesson,
    swimmingClass: SwimmingClass,
    trx: TransactionClientContract
  ): Promise<void> {
    const instructors = await ClassInstructor.query({ client: trx }).where(
      'swimmingClassId',
      swimmingClass.id
    )
    if (instructors.length > 0) {
      await lesson.related('lessonInstructors').createMany(
        instructors.map((instructor) => ({
          membershipId: instructor.membershipId,
          invitationId: instructor.invitationId,
          role: instructor.role,
        }))
      )
    }
  }

  /** Copy a lesson's activity snapshots into empty lessons in the same stage. */
  async copyLessonActivities(
    sourceLesson: ClassLesson,
    targetLessonIds: number[]
  ): Promise<number> {
    return db.transaction(async (trx) => {
      const source = await ClassLesson.query({ client: trx })
        .where('id', sourceLesson.id)
        .preload('lessonActivities', (activitiesQuery) => activitiesQuery.orderBy('position'))
        .firstOrFail()
      const sourceClass = await SwimmingClass.findOrFail(source.swimmingClassId, { client: trx })

      if (source.lessonActivities.length === 0) {
        throw new ClassAuthoringException('The source lesson has no activities to copy.')
      }

      const uniqueTargetIds = uniqueNumbers(targetLessonIds)
      const targets = await ClassLesson.query({ client: trx })
        .whereIn('id', uniqueTargetIds)
        .whereHas('swimmingClass', (classQuery) =>
          classQuery
            .where('schoolId', sourceClass.schoolId)
            .where('levelStageId', sourceClass.levelStageId)
        )
        .preload('lessonActivities')

      if (targets.length !== uniqueTargetIds.length) {
        throw new ClassAuthoringException('Choose lessons from the same stage.')
      }

      if (targets.some((target) => target.lessonActivities.length > 0)) {
        throw new ClassAuthoringException('Activities can only be copied into empty lessons.')
      }

      const activitySnapshots = source.lessonActivities.map((activity) => ({
        levelStageActivityId: activity.levelStageActivityId,
        schoolActivityId: activity.schoolActivityId,
        categoryName: activity.categoryName,
        activityName: activity.activityName,
        activityDescription: activity.activityDescription,
        durationMinutes: activity.durationMinutes,
        ledBy: activity.ledBy,
        successCue: activity.successCue,
        position: activity.position,
      }))

      for (const target of targets) {
        target.useTransaction(trx)
        await target.related('lessonActivities').createMany(activitySnapshots)
      }

      return targets.length
    })
  }

  protected assertConclusionObservation(data: StoreClassLessonInput): void {
    if (data.intent === 'conclude' && !data.observation?.trim()) {
      throw new ClassAuthoringException(
        'Lesson observation is required before concluding a lesson.'
      )
    }
  }

  protected async resolveLessonActivities(
    swimmingClass: SwimmingClass,
    requested: number[],
    trx: TransactionClientContract
  ): Promise<number[]> {
    const curriculumSkills = await this.lessonCurriculumSkills(swimmingClass, trx)

    const allowedActivityIds = new Set(
      curriculumSkills.flatMap((skill) => (skill.activities ?? []).map((activity) => activity.id))
    )
    const activityIds = uniqueNumbers(requested)
    for (const activityId of activityIds) {
      if (!allowedActivityIds.has(activityId)) {
        throw new ClassAuthoringException(
          'A selected activity does not belong to the class skills.'
        )
      }
    }
    return activityIds
  }

  protected async resolveSchoolActivities(
    swimmingClass: SwimmingClass,
    requested: number[],
    requestedDurations: number[],
    requestedLedBys: number[],
    trx: TransactionClientContract
  ): Promise<SchoolLessonActivitySelection[]> {
    if (requested.length === 0) {
      return []
    }
    const activityIds = uniqueNumbers(requested)
    const curriculumSkills = await this.lessonCurriculumSkills(swimmingClass, trx)
    const allowedSkillIds = new Set(curriculumSkills.map((skill) => skill.id))
    const allowedLegacyActivityIds = new Set(
      curriculumSkills.flatMap((skill) => (skill.activities ?? []).map((activity) => activity.id))
    )

    const activities = await SchoolActivity.query({ client: trx })
      .where('schoolId', swimmingClass.schoolId)
      .where('isActive', true)
      .whereIn('id', activityIds)
      .preload('category')

    if (activities.length !== activityIds.length) {
      throw new ClassAuthoringException('Choose activities from this school’s activity bank.')
    }

    for (const activity of activities) {
      if (
        (activity.levelId !== null && activity.levelId !== swimmingClass.levelId) ||
        (activity.levelStageId !== null && activity.levelStageId !== swimmingClass.levelStageId) ||
        (activity.levelStageSkillId !== null && !allowedSkillIds.has(activity.levelStageSkillId)) ||
        (activity.levelStageActivityId !== null &&
          !allowedLegacyActivityIds.has(activity.levelStageActivityId))
      ) {
        throw new ClassAuthoringException(
          'A selected activity bank item does not match this class curriculum.'
        )
      }
    }

    const byId = new Map(activities.map((activity) => [activity.id, activity]))
    return requested.flatMap((id, index) => {
      const activity = byId.get(id)
      return activity
        ? [
            {
              activity,
              durationMinutes: requestedDurations[index] ?? activity.durationMinutes,
              ledBy: requestedLedBys[index] ?? activity.ledBy,
            },
          ]
        : []
    })
  }

  protected async lessonCurriculumSkills(
    swimmingClass: SwimmingClass,
    trx: TransactionClientContract
  ): Promise<LevelStageSkill[]> {
    const classSkills = await ClassSkill.query({ client: trx })
      .where('swimmingClassId', swimmingClass.id)
      .preload('levelStageSkill', (skillQuery) => skillQuery.preload('activities'))
    if (classSkills.length > 0) {
      return classSkills.flatMap((classSkill) =>
        classSkill.levelStageSkill ? [classSkill.levelStageSkill] : []
      )
    }

    if (swimmingClass.levelStageId === null) {
      return []
    }

    return LevelStageSkill.query({ client: trx })
      .where('levelStageId', swimmingClass.levelStageId)
      .preload('activities')
  }

  protected async resolveCustomSchoolActivities(
    swimmingClass: SwimmingClass,
    data: StoreClassLessonInput | UpdateLessonActivitiesInput,
    trx: TransactionClientContract
  ): Promise<CustomSchoolActivitySelection[]> {
    const names = data.customActivityNames ?? []
    if (names.length === 0) {
      return []
    }

    const categoryIds = data.customActivityCategoryIds ?? []
    const descriptions = data.customActivityDescriptions ?? []
    const successCues = data.customActivitySuccessCues ?? []
    const durations = data.customActivityDurations ?? []
    const ledBys = data.customActivityLedBys ?? []
    const categories = await SchoolActivityCategory.query({ client: trx })
      .where('schoolId', swimmingClass.schoolId)
      .where('isActive', true)
      .whereIn('id', uniqueNumbers(categoryIds))
    const categoryById = new Map(categories.map((category) => [category.id, category]))
    const maxPositionRow = await SchoolActivity.query({ client: trx })
      .where('schoolId', swimmingClass.schoolId)
      .max('position as maxPosition')
      .first()
    let nextPosition = Number(maxPositionRow?.$extras.maxPosition ?? 0) + 1
    const selections: CustomSchoolActivitySelection[] = []

    for (const [index, rawName] of names.entries()) {
      const name = rawName.trim()
      if (!name) {
        continue
      }

      const categoryId = categoryIds[index]
      const category = categoryById.get(categoryId)
      if (!category) {
        throw new ClassAuthoringException('Choose a category from this school’s activity bank.')
      }

      const duration = durations[index] ?? 1
      const ledBy = ledBys[index] ?? LessonActivityLeader.INSTRUCTOR
      let activity = await SchoolActivity.query({ client: trx })
        .where('schoolId', swimmingClass.schoolId)
        .where('name', name)
        .first()

      if (activity) {
        if (!activity.isActive) {
          activity.useTransaction(trx)
          activity.isActive = true
          await activity.save()
        }
      } else {
        activity = await SchoolActivity.create(
          {
            schoolId: swimmingClass.schoolId,
            schoolActivityCategoryId: category.id,
            name,
            description: descriptions[index] || null,
            successCue: successCues[index] || null,
            durationMinutes: duration,
            ledBy,
            focusArea: null,
            equipment: null,
            safetyNotes: null,
            progressionEasier: null,
            progressionHarder: null,
            levelId: null,
            levelStageId: null,
            levelStageSkillId: null,
            levelStageActivityId: null,
            position: nextPosition++,
            isActive: true,
            sourceType: 'school',
            sourceKey: null,
            sourceVersion: null,
          },
          { client: trx }
        )
      }

      selections.push({ activity, durationMinutes: duration, ledBy })
    }

    return selections
  }

  protected async syncLessonActivities(
    lesson: ClassLesson,
    legacyActivityIds: number[],
    schoolActivities: SchoolLessonActivitySelection[]
  ): Promise<void> {
    await lesson.related('lessonActivities').createMany([
      ...legacyActivityIds.map((levelStageActivityId, index) => ({
        levelStageActivityId,
        schoolActivityId: null,
        position: index + 1,
      })),
      ...schoolActivities.map((selection, index) => {
        const activity = selection.activity
        const category = activity.category
        return {
          levelStageActivityId: null,
          schoolActivityId: activity.id,
          position: legacyActivityIds.length + index + 1,
          categoryName: category?.name ?? 'Activity Bank',
          activityName: activity.name,
          activityDescription: activity.description,
          durationMinutes: selection.durationMinutes,
          ledBy: selection.ledBy,
          successCue: activity.successCue,
        }
      }),
    ])
  }

  async removeLesson(lesson: ClassLesson): Promise<void> {
    await db.transaction(async (trx) => {
      await LessonActivity.query({ client: trx }).where('classLessonId', lesson.id).delete()
      lesson.useTransaction(trx)
      await lesson.delete()
    })
  }

  async cancel(swimmingClass: SwimmingClass): Promise<SwimmingClass> {
    return db.transaction(async (trx) => {
      const lessons = await ClassLesson.query({ client: trx })
        .where('swimmingClassId', swimmingClass.id)
        .select('id')
      const lessonIds = lessons.map((lesson) => lesson.id)

      if (lessonIds.length > 0) {
        await LessonActivity.query({ client: trx }).whereIn('classLessonId', lessonIds).delete()
        await LessonInstructor.query({ client: trx }).whereIn('classLessonId', lessonIds).delete()
        await trx.from('enrollment_lessons').whereIn('class_lesson_id', lessonIds).delete()
        await ClassLesson.query({ client: trx }).whereIn('id', lessonIds).delete()
      }

      swimmingClass.useTransaction(trx)
      swimmingClass.cancel()
      await swimmingClass.save()
      return swimmingClass
    })
  }

  protected async loadTerm(
    school: School,
    termId: number,
    trx: TransactionClientContract
  ): Promise<Term> {
    const term = await Term.query({ client: trx })
      .where('id', termId)
      .whereHas('swimYear', (yearQuery) => yearQuery.where('schoolId', school.id))
      .first()

    if (!term) {
      throw new ClassAuthoringException('Choose a term from one of this school’s swim years.')
    }

    return term
  }

  protected assertDateWithinTerm(date: DateTime, term: Term): void {
    if (date < term.startsOn.startOf('day') || date > term.endsOn.startOf('day')) {
      throw new ClassAuthoringException(
        `Lesson dates must fall within ${term.name} (${term.startsOn.toFormat('d LLL yyyy')} – ${term.endsOn.toFormat('d LLL yyyy')}).`
      )
    }
  }

  protected async loadAvailableLevel(
    school: School,
    levelId: number,
    trx: TransactionClientContract
  ): Promise<Level> {
    const level = await Level.query({ client: trx })
      .where('id', levelId)
      .preload('program')
      .preload('schoolLevelSettings', (settingsQuery) => settingsQuery.where('schoolId', school.id))
      .preload('stages', (stagesQuery) =>
        stagesQuery.preload('skills', (skillsQuery) => skillsQuery.preload('activities'))
      )
      .firstOrFail()

    if (!level.program.isActive) {
      throw new ClassAuthoringException('This program is not yet active.')
    }

    const setting = level.schoolLevelSettings?.[0]
    if (setting?.available === false) {
      throw new ClassAuthoringException('This program level is not available for this school.')
    }

    return level
  }

  protected async resolveClassCurriculum(
    school: School,
    level: Level,
    selection: { levelStageId: number; skillIds?: number[] },
    trx: TransactionClientContract
  ): Promise<CurriculumSelection> {
    const stage = level.stages.find((candidate) => candidate.id === selection.levelStageId)
    if (!stage) {
      throw new ClassAuthoringException('Choose a stage from this level.')
    }

    const skillIds = uniqueNumbers(selection.skillIds ?? [])
    if (skillIds.length === 0) {
      return { stage, skillIds, skills: [] }
    }

    const bankSkills = await SkillBankSkill.query({ client: trx })
      .whereIn('id', skillIds)
      .where('isActive', true)
      .where((query) => query.whereNull('schoolId').orWhere('schoolId', school.id))

    if (bankSkills.length !== skillIds.length) {
      throw new ClassAuthoringException('A selected skill is not available in the skill bank.')
    }

    const stageSkillIds = new Set(stage.skills.map((skill) => skill.id))
    const stageSkillByName = new Map(
      stage.skills.map((skill) => [skill.name.trim().toLowerCase(), skill.id])
    )

    return {
      stage,
      skillIds,
      skills: skillIds.map((skillId) => {
        const skill = bankSkills.find((candidate) => candidate.id === skillId)!
        const sourceStageSkillId = skill.sourceKey?.startsWith('level_stage_skill:')
          ? Number(skill.sourceKey.split(':')[1])
          : null
        const matchedStageSkillId =
          sourceStageSkillId && stageSkillIds.has(sourceStageSkillId)
            ? sourceStageSkillId
            : (stageSkillByName.get(skill.name.trim().toLowerCase()) ?? null)

        return {
          skillBankSkillId: skill.id,
          levelStageSkillId: matchedStageSkillId,
        }
      }),
    }
  }

  protected resolvePrerequisiteStageId(
    level: Level,
    stageId: number | undefined,
    classStageId: number
  ): number | null {
    if (stageId === undefined) {
      return null
    }

    if (stageId === classStageId) {
      throw new ClassAuthoringException('A class cannot require its own stage.')
    }

    if (!level.stages.some((stage) => stage.id === stageId)) {
      throw new ClassAuthoringException('Choose a prerequisite stage from this level.')
    }

    return stageId
  }

  protected async assertLessonActivitiesCovered(
    swimmingClass: SwimmingClass,
    selection: CurriculumSelection,
    trx: TransactionClientContract
  ): Promise<void> {
    const usedActivities = await LessonActivity.query({ client: trx }).whereHas(
      'classLesson',
      (lessonQuery) => lessonQuery.where('swimmingClassId', swimmingClass.id)
    )
    const usedActivityIds = usedActivities.flatMap((lessonActivity) =>
      lessonActivity.levelStageActivityId ? [lessonActivity.levelStageActivityId] : []
    )

    if (usedActivityIds.length === 0) {
      return
    }

    const selectedLegacySkillIds = selection.skills.flatMap((skill) =>
      skill.levelStageSkillId ? [skill.levelStageSkillId] : []
    )

    const allowed = await LevelStageActivity.query({ client: trx })
      .whereIn('id', uniqueNumbers(usedActivityIds))
      .whereIn('levelStageSkillId', selectedLegacySkillIds)

    if (allowed.length !== uniqueNumbers(usedActivityIds).length) {
      throw new ClassAuthoringException(
        'Lessons use activities outside the selected skills; adjust the lessons first.'
      )
    }
  }

  protected async assertNameAvailable(
    school: School,
    name: string,
    levelStageId: number,
    trx: TransactionClientContract,
    excludeClassId?: number
  ): Promise<void> {
    const nameQuery = SwimmingClass.query({ client: trx })
      .where('schoolId', school.id)
      .where('levelStageId', levelStageId)
      .whereRaw('lower(name) = ?', [name.trim().toLowerCase()])
    if (excludeClassId) {
      nameQuery.whereNot('id', excludeClassId)
    }
    if (await nameQuery.first()) {
      throw new ClassAuthoringException('A class with this name already exists.')
    }
  }

  /**
   * Validate the selected instructor set: memberships must be Teachers or
   * Head Coaches of the school, invitations must be this school's pending
   * Teacher invitations, and the optional invite-new fields create (or
   * refresh) an invitation that joins the set.
   */
  protected async resolveInstructors(
    school: School,
    data: InstructorSelection,
    trx: TransactionClientContract
  ): Promise<ResolvedInstructors> {
    if (data.leadInstructorMembershipId && data.leadInstructorInvitationId) {
      throw new ClassAuthoringException('Choose only one lead instructor.')
    }

    const hasNewRoleFields =
      data.leadInstructorMembershipId ||
      data.leadInstructorInvitationId ||
      (data.supportingInstructorMembershipIds?.length ?? 0) > 0 ||
      (data.supportingInstructorInvitationIds?.length ?? 0) > 0

    const legacyMembershipIds = uniqueNumbers(data.instructorMembershipIds ?? [])
    const legacyInvitationIds = uniqueNumbers(data.instructorInvitationIds ?? [])
    const leadMembershipId =
      data.leadInstructorMembershipId ?? (!hasNewRoleFields ? legacyMembershipIds[0] : undefined)
    const leadInvitationId =
      data.leadInstructorInvitationId ??
      (!hasNewRoleFields && !leadMembershipId ? legacyInvitationIds[0] : undefined)

    const supportingMembershipIds = uniqueNumbers([
      ...(data.supportingInstructorMembershipIds ?? []),
      ...(!hasNewRoleFields ? legacyMembershipIds.slice(leadMembershipId ? 1 : 0) : []),
    ]).filter((id) => id !== leadMembershipId)
    const supportingInvitationIds = uniqueNumbers([
      ...(data.supportingInstructorInvitationIds ?? []),
      ...(!hasNewRoleFields ? legacyInvitationIds.slice(leadInvitationId ? 1 : 0) : []),
    ]).filter((id) => id !== leadInvitationId)

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
        ? [
            {
              role: ClassInstructorRole.LEAD,
              membershipId: leadMembershipId,
              invitationId: null,
            },
          ]
        : []),
      ...(leadInvitationId
        ? [
            {
              role: ClassInstructorRole.LEAD,
              membershipId: null,
              invitationId: leadInvitationId,
            },
          ]
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

  /** Replace the class's instructor rows with the resolved set. */
  protected async syncInstructors(
    swimmingClass: SwimmingClass,
    instructors: ResolvedInstructors,
    trx: TransactionClientContract
  ): Promise<void> {
    await ClassInstructor.query({ client: trx }).where('swimmingClassId', swimmingClass.id).delete()
    await swimmingClass.related('classInstructors').createMany(instructors.assignments)
  }

  /** Send the newly created teacher invitation once the transaction commits. */
  protected queueInvitationMail(
    instructors: ResolvedInstructors,
    school: School,
    trx: TransactionClientContract
  ): void {
    const invitation = instructors.newInvitation
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
