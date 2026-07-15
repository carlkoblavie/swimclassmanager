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
import Membership from '#models/membership'
import Role from '#models/role'
import School from '#models/school'
import SwimmingClass from '#models/swimming_class'
import ClassActivity from '#models/class_activity'
import ClassSkill from '#models/class_skill'
import { RoleName } from '#values/role'
import {
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
  activityIds: number[]
}

export default class ClassSeriesAuthoringService {
  /**
   * Create one class per submitted day under an available level, each with
   * its own curriculum picked from the level's stages. Instructor and
   * location are assigned later via edit.
   */
  async createMany(school: School, data: StoreSwimmingClassesInput): Promise<SwimmingClass[]> {
    return db.transaction(async (trx) => {
      const level = await this.loadAvailableLevel(school, data.levelId, trx)

      this.assertUniqueWithinPayload(data.days)
      for (const day of data.days) {
        await this.assertNameAndCodeAvailable(school, day.name, day.code, trx)
      }

      const classes: SwimmingClass[] = []
      for (const day of data.days) {
        const selection = this.resolveCurriculum(level, day)
        const swimmingClass = new SwimmingClass()
        swimmingClass.useTransaction(trx)
        swimmingClass.merge({
          schoolId: school.id,
          levelId: level.id,
          levelStageId: selection.stage.id,
          name: day.name,
          code: day.code,
          weekday: day.weekday,
          startTime: day.startTime,
          durationMinutes: day.durationMinutes,
          location: null,
        })
        await swimmingClass.save()
        await this.replaceCurriculum(swimmingClass, selection, trx)
        classes.push(swimmingClass)
      }

      return classes
    })
  }

  /**
   * Update one class: schedule, name/code, curriculum, location, and
   * instructor (existing member, invited Teacher, or none).
   */
  async update(
    swimmingClass: SwimmingClass,
    school: School,
    data: UpdateSwimmingClassInput
  ): Promise<SwimmingClass> {
    return db.transaction(async (trx) => {
      const level = await this.loadAvailableLevel(school, swimmingClass.levelId, trx)

      await this.assertNameAndCodeAvailable(school, data.name, data.code, trx, swimmingClass.id)
      const selection = this.resolveCurriculum(level, data)
      const instructor = await this.resolveInstructor(school, data, trx)

      swimmingClass.useTransaction(trx)
      swimmingClass.merge({
        levelStageId: selection.stage.id,
        name: data.name,
        code: data.code,
        weekday: data.weekday,
        startTime: data.startTime,
        durationMinutes: data.durationMinutes,
        location: data.location ?? null,
        instructorMembershipId: instructor.membershipId ?? null,
        pendingInstructorInvitationId: instructor.invitation?.id ?? null,
      })
      await swimmingClass.save()

      await ClassSkill.query({ client: trx }).where('swimmingClassId', swimmingClass.id).delete()
      await ClassActivity.query({ client: trx })
        .where('swimmingClassId', swimmingClass.id)
        .delete()
      await this.replaceCurriculum(swimmingClass, selection, trx)

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

  protected resolveCurriculum(
    level: Level,
    day: Pick<DayInput, 'levelStageId' | 'skillIds' | 'activityIds'>
  ): CurriculumSelection {
    const stage = level.stages.find((candidate) => candidate.id === day.levelStageId)
    if (!stage) {
      throw new ClassAuthoringException('Choose a stage from this level.')
    }

    const stageSkillIds = new Set(stage.skills.map((skill) => skill.id))
    const skillIds = uniqueNumbers(day.skillIds ?? [])
    for (const skillId of skillIds) {
      if (!stageSkillIds.has(skillId)) {
        throw new ClassAuthoringException('A selected skill does not belong to this stage.')
      }
    }

    const selectableActivityIds = new Set(
      stage.skills
        .filter((skill) => skillIds.includes(skill.id))
        .flatMap((skill) => skill.activities.map((activity) => activity.id))
    )
    const activityIds = uniqueNumbers(day.activityIds ?? [])
    for (const activityId of activityIds) {
      if (!selectableActivityIds.has(activityId)) {
        throw new ClassAuthoringException(
          'A selected activity does not belong to the selected skills.'
        )
      }
    }

    return { stage, skillIds, activityIds }
  }

  protected async replaceCurriculum(
    swimmingClass: SwimmingClass,
    selection: CurriculumSelection,
    _trx: TransactionClientContract
  ): Promise<void> {
    await swimmingClass
      .related('classSkills')
      .createMany(selection.skillIds.map((levelStageSkillId) => ({ levelStageSkillId })))
    await swimmingClass
      .related('classActivities')
      .createMany(selection.activityIds.map((levelStageActivityId) => ({ levelStageActivityId })))
  }

  protected assertUniqueWithinPayload(days: DayInput[]): void {
    const names = days.map((day) => day.name.trim().toLowerCase())
    if (new Set(names).size !== names.length) {
      throw new ClassAuthoringException('A class with this name already exists.')
    }
    const codes = days.map((day) => day.code.trim().toLowerCase())
    if (new Set(codes).size !== codes.length) {
      throw new ClassAuthoringException('A class with this code already exists.')
    }
  }

  protected async assertNameAndCodeAvailable(
    school: School,
    name: string,
    code: string,
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

    const codeQuery = SwimmingClass.query({ client: trx })
      .where('schoolId', school.id)
      .whereRaw('lower(code) = ?', [code.trim().toLowerCase()])
    if (excludeClassId) {
      codeQuery.whereNot('id', excludeClassId)
    }
    if (await codeQuery.first()) {
      throw new ClassAuthoringException('A class with this code already exists.')
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
