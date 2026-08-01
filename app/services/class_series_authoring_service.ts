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
import Membership from '#models/membership'
import Role from '#models/role'
import SchoolActivity from '#models/school_activity'
import type School from '#models/school'
import SwimmingClass from '#models/swimming_class'
import ClassInstructor from '#models/class_instructor'
import ClassLesson from '#models/class_lesson'
import ClassSkill from '#models/class_skill'
import LessonActivity from '#models/lesson_activity'
import Term from '#models/term'
import {
  ClassInstructorRole,
  type ClassInstructorRole as ClassInstructorRoleValue,
} from '#values/class_instructor_role'
import { RoleName } from '#values/role'
import { classCode, codeSegment, nextTierNumber } from '#values/account_code'
import {
  type StoreClassLessonInput,
  type StoreSwimmingClassesInput,
  type UpdateSwimmingClassInput,
} from '#validators/swimming_class'

const INSTRUCTOR_ROLE_NAMES = [RoleName.TEACHER, RoleName.HEAD_COACH] as string[]

function hasInstructorRole(membership: Membership): boolean {
  return membership.roles.some((role) => INSTRUCTOR_ROLE_NAMES.includes(role.name))
}

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values)]
}

type DayInput = StoreSwimmingClassesInput['days'][number]

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
>

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
}

type SchoolLessonActivitySelection = {
  activity: SchoolActivity
  durationMinutes: number
  ledBy: number
}

export default class ClassSeriesAuthoringService {
  /**
   * Create one class per submitted day under an available level. Each class
   * carries its stage and skills; its first dated lesson is created empty of
   * activities, which are planned lesson by lesson.
   */
  async createMany(school: School, data: StoreSwimmingClassesInput): Promise<SwimmingClass[]> {
    return db.transaction(async (trx) => {
      const level = await this.loadAvailableLevel(school, data.levelId, trx)
      const term = await this.loadTerm(school, data.termId, trx)
      const instructors = await this.resolveInstructors(school, data, trx)

      this.assertUniqueWithinPayload(data.days)
      for (const day of data.days) {
        await this.assertNameAvailable(school, day.name, trx)
      }

      const existingCodes = (await SwimmingClass.query({ client: trx }).select('code')).map(
        (row) => row.code
      )

      const classes: SwimmingClass[] = []
      for (const day of data.days) {
        if (day.lessonDate.weekday !== day.weekday) {
          throw new ClassAuthoringException('The first lesson must fall on the class day.')
        }
        this.assertDateWithinTerm(day.lessonDate, term)
        const selection = this.resolveClassCurriculum(level, day)
        const code = classCode(selection.stage.code, nextTierNumber(existingCodes, 'class'))
        existingCodes.push(code)

        const swimmingClass = new SwimmingClass()
        swimmingClass.useTransaction(trx)
        swimmingClass.merge({
          schoolId: school.id,
          levelId: level.id,
          levelStageId: selection.stage.id,
          termId: term.id,
          name: day.name,
          code,
          weekday: day.weekday,
          startTime: day.startTime,
          durationMinutes: day.durationMinutes,
          location: null,
        })
        await swimmingClass.save()
        await this.syncInstructors(swimmingClass, instructors, trx)
        await swimmingClass
          .related('classSkills')
          .createMany(selection.skillIds.map((levelStageSkillId) => ({ levelStageSkillId })))
        await swimmingClass.related('lessons').create({ date: day.lessonDate })
        classes.push(swimmingClass)
      }

      this.queueInvitationMail(instructors, school, trx)

      return classes
    })
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

      await this.assertNameAvailable(school, data.name, trx, swimmingClass.id)
      const selection = this.resolveClassCurriculum(level, data)
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
        name: data.name,
        code,
        weekday: data.weekday,
        startTime: data.startTime,
        durationMinutes: data.durationMinutes,
        location: data.location ?? null,
      })
      await swimmingClass.save()

      await this.syncInstructors(swimmingClass, instructors, trx)

      await ClassSkill.query({ client: trx }).where('swimmingClassId', swimmingClass.id).delete()
      await swimmingClass
        .related('classSkills')
        .createMany(selection.skillIds.map((levelStageSkillId) => ({ levelStageSkillId })))

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
        swimmingClass.id,
        data.activityIds ?? [],
        trx
      )
      const schoolActivities = await this.resolveSchoolActivities(
        swimmingClass.schoolId,
        data.schoolActivityIds ?? [],
        data.schoolActivityDurations ?? [],
        data.schoolActivityLedBys ?? [],
        trx
      )
      this.assertConclusionObservation(data)

      // The level's curriculum length is a hard lesson allowance per class.
      const level = await Level.findOrFail(swimmingClass.levelId, { client: trx })
      if (level.classesCount !== null) {
        const plannedCount = await ClassLesson.query({ client: trx })
          .where('swimmingClassId', swimmingClass.id)
          .count('* as total')
        if (Number(plannedCount[0].$extras.total) >= level.classesCount) {
          throw new ClassAuthoringException(
            `This class already has all ${level.classesCount} ${level.classesCount === 1 ? 'lesson' : 'lessons'} its level allows.`
          )
        }
      }

      const latest = await ClassLesson.query({ client: trx })
        .where('swimmingClassId', swimmingClass.id)
        .orderBy('date', 'desc')
        .first()
      const date = this.nextLessonDate(swimmingClass.weekday, latest?.date ?? null)

      if (swimmingClass.termId) {
        const term = await Term.findOrFail(swimmingClass.termId, { client: trx })
        this.assertDateWithinTerm(date, term)
      }

      swimmingClass.useTransaction(trx)
      const lesson = await swimmingClass.related('lessons').create({
        date,
        objectives: data.objectives,
        notes: data.notes ?? null,
        observation: data.observation ?? null,
        concludedAt: data.intent === 'conclude' ? DateTime.now() : null,
      })
      await this.syncLessonActivities(lesson, legacyActivityIds, schoolActivities)
      return lesson
    })
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
        lesson.swimmingClassId,
        data.activityIds ?? [],
        trx
      )
      const schoolActivities = await this.resolveSchoolActivities(
        swimmingClass.schoolId,
        data.schoolActivityIds ?? [],
        data.schoolActivityDurations ?? [],
        data.schoolActivityLedBys ?? [],
        trx
      )
      this.assertConclusionObservation(data)

      lesson.useTransaction(trx)
      lesson.objectives = data.objectives
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

  protected assertConclusionObservation(data: StoreClassLessonInput): void {
    if (data.intent === 'conclude' && !data.observation?.trim()) {
      throw new ClassAuthoringException(
        'Lesson observation is required before concluding a lesson.'
      )
    }
  }

  protected async resolveLessonActivities(
    swimmingClassId: number,
    requested: number[],
    trx: TransactionClientContract
  ): Promise<number[]> {
    const classSkills = await ClassSkill.query({ client: trx })
      .where('swimmingClassId', swimmingClassId)
      .preload('levelStageSkill', (skillQuery) => skillQuery.preload('activities'))

    const allowedActivityIds = new Set(
      classSkills.flatMap((classSkill) =>
        (classSkill.levelStageSkill?.activities ?? []).map((activity) => activity.id)
      )
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
    schoolId: number,
    requested: number[],
    requestedDurations: number[],
    requestedLedBys: number[],
    trx: TransactionClientContract
  ): Promise<SchoolLessonActivitySelection[]> {
    if (requested.length === 0) {
      return []
    }
    const activityIds = uniqueNumbers(requested)

    const activities = await SchoolActivity.query({ client: trx })
      .where('schoolId', schoolId)
      .where('isActive', true)
      .whereIn('id', activityIds)
      .preload('category')

    if (activities.length !== activityIds.length) {
      throw new ClassAuthoringException('Choose activities from this school’s activity bank.')
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
    swimmingClass.cancel()
    await swimmingClass.save()
    return swimmingClass
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

  protected resolveClassCurriculum(
    level: Level,
    selection: Pick<DayInput, 'levelStageId' | 'skillIds'>
  ): CurriculumSelection {
    const stage = level.stages.find((candidate) => candidate.id === selection.levelStageId)
    if (!stage) {
      throw new ClassAuthoringException('Choose a stage from this level.')
    }

    const stageSkillIds = new Set(stage.skills.map((skill) => skill.id))
    const skillIds = uniqueNumbers(selection.skillIds ?? [])
    for (const skillId of skillIds) {
      if (!stageSkillIds.has(skillId)) {
        throw new ClassAuthoringException('A selected skill does not belong to this stage.')
      }
    }

    return { stage, skillIds }
  }

  protected async assertLessonActivitiesCovered(
    swimmingClass: SwimmingClass,
    selection: CurriculumSelection,
    trx: TransactionClientContract
  ): Promise<void> {
    const usedActivityIds = (
      await LessonActivity.query({ client: trx }).whereHas('classLesson', (lessonQuery) =>
        lessonQuery.where('swimmingClassId', swimmingClass.id)
      )
    ).flatMap((lessonActivity) =>
      lessonActivity.levelStageActivityId ? [lessonActivity.levelStageActivityId] : []
    )

    if (usedActivityIds.length === 0) {
      return
    }

    const allowed = await LevelStageActivity.query({ client: trx })
      .whereIn('id', uniqueNumbers(usedActivityIds))
      .whereIn('levelStageSkillId', selection.skillIds)

    if (allowed.length !== uniqueNumbers(usedActivityIds).length) {
      throw new ClassAuthoringException(
        'Lessons use activities outside the selected skills; adjust the lessons first.'
      )
    }
  }

  protected assertUniqueWithinPayload(days: DayInput[]): void {
    const names = days.map((day) => day.name.trim().toLowerCase())
    if (new Set(names).size !== names.length) {
      throw new ClassAuthoringException('A class with this name already exists.')
    }
  }

  protected async assertNameAvailable(
    school: School,
    name: string,
    trx: TransactionClientContract,
    excludeClassId?: number
  ): Promise<void> {
    const nameQuery = SwimmingClass.query({ client: trx })
      .where('schoolId', school.id)
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
      const teacherRole = await Role.findByOrFail('name', RoleName.TEACHER, { client: trx })
      const invitations = await Invitation.query({ client: trx })
        .whereIn('id', invitationIds)
        .where('schoolId', school.id)
        .where('roleId', teacherRole.id)
        .whereNull('acceptedAt')

      if (invitations.length !== invitationIds.length) {
        throw new ClassAuthoringException('Choose pending Teacher invitations from this school.')
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
