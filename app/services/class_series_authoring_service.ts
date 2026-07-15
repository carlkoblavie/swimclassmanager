import string from '@adonisjs/core/helpers/string'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'
import ClassAuthoringException from '#exceptions/class_authoring_exception'
import InvitationMail from '#mails/invitation'
import Invitation from '#models/invitation'
import Level from '#models/level'
import LevelStage from '#models/level_stage'
import LevelStageActivity from '#models/level_stage_activity'
import Membership from '#models/membership'
import Role from '#models/role'
import School from '#models/school'
import SwimmingClass from '#models/swimming_class'
import ClassLesson from '#models/class_lesson'
import ClassSkill from '#models/class_skill'
import LessonActivity from '#models/lesson_activity'
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

type CurriculumSelection = {
  stage: LevelStage
  skillIds: number[]
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
        const selection = this.resolveClassCurriculum(level, day)
        const code = classCode(selection.stage.code, nextTierNumber(existingCodes, 'class'))
        existingCodes.push(code)

        const swimmingClass = new SwimmingClass()
        swimmingClass.useTransaction(trx)
        swimmingClass.merge({
          schoolId: school.id,
          levelId: level.id,
          levelStageId: selection.stage.id,
          name: day.name,
          code,
          weekday: day.weekday,
          startTime: day.startTime,
          durationMinutes: day.durationMinutes,
          location: null,
        })
        await swimmingClass.save()
        await swimmingClass
          .related('classSkills')
          .createMany(selection.skillIds.map((levelStageSkillId) => ({ levelStageSkillId })))
        await swimmingClass.related('lessons').create({ date: day.lessonDate })
        classes.push(swimmingClass)
      }

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
      const instructor = await this.resolveInstructor(school, data, trx)

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
        name: data.name,
        code,
        weekday: data.weekday,
        startTime: data.startTime,
        durationMinutes: data.durationMinutes,
        location: data.location ?? null,
        instructorMembershipId: instructor.membershipId ?? null,
        pendingInstructorInvitationId: instructor.invitation?.id ?? null,
      })
      await swimmingClass.save()

      await ClassSkill.query({ client: trx }).where('swimmingClassId', swimmingClass.id).delete()
      await swimmingClass
        .related('classSkills')
        .createMany(selection.skillIds.map((levelStageSkillId) => ({ levelStageSkillId })))

      if (instructor.invitation) {
        trx.after('commit', async () => {
          await mail.sendLater(
            new InvitationMail(
              instructor.invitation!.email,
              instructor.invitation!.token,
              school.name,
              RoleName.TEACHER
            )
          )
        })
      }

      return swimmingClass
    })
  }

  /**
   * Plan the class's next lesson: dates are system-appended on the class's
   * weekday after the last planned lesson; the payload carries only that
   * week's activities, drawn from the class's skills.
   */
  async planLesson(swimmingClass: SwimmingClass, data: StoreClassLessonInput): Promise<ClassLesson> {
    return db.transaction(async (trx) => {
      const classSkills = await ClassSkill.query({ client: trx })
        .where('swimmingClassId', swimmingClass.id)
        .preload('levelStageSkill', (skillQuery) => skillQuery.preload('activities'))

      const allowedActivityIds = new Set(
        classSkills.flatMap((classSkill) =>
          (classSkill.levelStageSkill?.activities ?? []).map((activity) => activity.id)
        )
      )
      const activityIds = uniqueNumbers(data.activityIds ?? [])
      for (const activityId of activityIds) {
        if (!allowedActivityIds.has(activityId)) {
          throw new ClassAuthoringException(
            'A selected activity does not belong to the class skills.'
          )
        }
      }

      const latest = await ClassLesson.query({ client: trx })
        .where('swimmingClassId', swimmingClass.id)
        .orderBy('date', 'desc')
        .first()
      const date = this.nextLessonDate(swimmingClass.weekday, latest?.date ?? null)

      swimmingClass.useTransaction(trx)
      const lesson = await swimmingClass.related('lessons').create({ date })
      await lesson
        .related('lessonActivities')
        .createMany(activityIds.map((levelStageActivityId) => ({ levelStageActivityId })))
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
    ).map((lessonActivity) => lessonActivity.levelStageActivityId)

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

  protected async resolveInstructor(
    school: School,
    data: UpdateSwimmingClassInput,
    trx: TransactionClientContract
  ): Promise<{ membershipId?: number; invitation?: Invitation }> {
    const mode = data.instructorMode ?? 'none'

    if (mode === 'none') {
      return {}
    }

    if (mode === 'existing') {
      if (!data.instructorMembershipId) {
        throw new ClassAuthoringException('Choose an instructor.')
      }

      const membership = await Membership.query({ client: trx })
        .where('id', data.instructorMembershipId)
        .where('schoolId', school.id)
        .preload('roles')
        .first()

      if (!membership || !hasInstructorRole(membership)) {
        throw new ClassAuthoringException('Choose a Teacher or Head Coach from this school.')
      }

      return { membershipId: membership.id }
    }

    if (!data.inviteTeacherEmail || !data.inviteTeacherName || !data.inviteTeacherPhone) {
      throw new ClassAuthoringException('Teacher email, name, and phone are required.')
    }

    const teacherRole = await Role.findByOrFail('name', RoleName.TEACHER, { client: trx })
    const invitation = await Invitation.updateOrCreate(
      { schoolId: school.id, email: data.inviteTeacherEmail },
      {
        roleId: teacherRole.id,
        inviteeName: data.inviteTeacherName,
        inviteePhone: data.inviteTeacherPhone,
        token: string.random(48),
        expiresAt: DateTime.now().plus({ days: 7 }),
        acceptedAt: null,
      },
      { client: trx }
    )

    return { invitation }
  }
}
