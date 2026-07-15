import { inject } from '@adonisjs/core'
import string from '@adonisjs/core/helpers/string'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'
import ClassAuthoringException from '#exceptions/class_authoring_exception'
import InvitationMail from '#mails/invitation'
import Invitation from '#models/invitation'
import Level from '#models/level'
import Membership from '#models/membership'
import Role from '#models/role'
import School from '#models/school'
import Skill from '#models/skill'
import SwimmingClass from '#models/swimming_class'
import ClassStage from '#models/class_stage'
import ClassStageSkill from '#models/class_stage_skill'
import SwimmingClassSession from '#models/swimming_class_session'
import SwimmingClassWeekday from '#models/swimming_class_weekday'
import type User from '#models/user'
import { RoleName } from '#values/role'
import {
  type StoreSwimmingClassInput,
  type UpdateSwimmingClassInput,
} from '#validators/swimming_class'
import ClassScheduleGenerationService from '#services/class_schedule_generation_service'

const INSTRUCTOR_ROLE_NAMES = [RoleName.TEACHER, RoleName.HEAD_COACH] as string[]

function hasInstructorRole(membership: Membership): boolean {
  return membership.roles.some((role) => INSTRUCTOR_ROLE_NAMES.includes(role.name))
}

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values)]
}

@inject()
export default class ClassSeriesAuthoringService {
  constructor(protected schedule: ClassScheduleGenerationService) {}

  async create(
    school: School,
    manager: User,
    data: StoreSwimmingClassInput
  ): Promise<SwimmingClass> {
    if (data.endTime <= data.startTime) {
      throw new ClassAuthoringException('Class end time must be after the start time.')
    }

    if (!school.organisation) {
      await school.load('organisation')
    }

    const sessions = this.schedule.generate({
      startDate: data.startDate,
      endDate: data.endDate,
      weekdays: data.weekdays,
      startTime: data.startTime,
      endTime: data.endTime,
    })

    if (sessions.length === 0) {
      throw new ClassAuthoringException('The schedule does not generate any sessions.')
    }

    this.assertStagesHaveSkills(data)

    return db.transaction(async (trx) => {
      const level = await Level.query({ client: trx })
        .where('id', data.levelId)
        .preload('schoolLevelSettings', (settingsQuery) =>
          settingsQuery.where('schoolId', school.id)
        )
        .firstOrFail()

      const setting = level.schoolLevelSettings?.[0]
      if (setting?.available === false) {
        throw new ClassAuthoringException('This program level is not available for this school.')
      }

      if (data.capacity > level.capacity) {
        throw new ClassAuthoringException('Class capacity cannot exceed the level capacity.')
      }

      const code = data.code?.trim()
        ? data.code.trim().toUpperCase()
        : await this.generateCode(school, trx)
      const instructor = await this.resolveInstructor(school, data, trx)
      const availableSkillIds = await this.availableSkillIds(school, data, trx)

      const swimmingClass = new SwimmingClass()
      swimmingClass.useTransaction(trx)
      swimmingClass.merge({
        schoolId: school.id,
        levelId: level.id,
        code,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        startTime: data.startTime,
        endTime: data.endTime,
        capacity: data.capacity,
        location: data.location,
        instructorMembershipId: instructor.membershipId ?? null,
        pendingInstructorInvitationId: instructor.invitation?.id ?? null,
      })
      await swimmingClass.save()

      await swimmingClass
        .related('weekdays')
        .createMany(uniqueNumbers(data.weekdays).map((weekday) => ({ weekday })))

      await swimmingClass.related('sessions').createMany(sessions)

      for (const stageData of data.stages.toSorted((a, b) => a.position - b.position)) {
        const stage = await swimmingClass.related('stages').create({
          name: stageData.name,
          position: stageData.position,
        })
        const skillIds = await this.resolveStageSkillIds(
          school,
          manager,
          stageData,
          availableSkillIds,
          trx
        )
        await stage.related('classStageSkills').createMany(skillIds.map((skillId) => ({ skillId })))
      }

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

      await swimmingClass.load('level', (levelQuery) => levelQuery.preload('program'))
      await swimmingClass.load('stages', (stagesQuery) =>
        stagesQuery.preload('skills').orderBy('position')
      )
      await swimmingClass.load('sessions', (sessionsQuery) => sessionsQuery.orderBy('startsAt'))
      await swimmingClass.load('weekdays')

      return swimmingClass
    })
  }

  async update(
    swimmingClass: SwimmingClass,
    school: School,
    manager: User,
    data: UpdateSwimmingClassInput
  ): Promise<SwimmingClass> {
    if (data.endTime <= data.startTime) {
      throw new ClassAuthoringException('Class end time must be after the start time.')
    }

    if (!school.organisation) {
      await school.load('organisation')
    }

    const sessions = this.schedule.generate({
      startDate: data.startDate,
      endDate: data.endDate,
      weekdays: data.weekdays,
      startTime: data.startTime,
      endTime: data.endTime,
    })

    if (sessions.length === 0) {
      throw new ClassAuthoringException('The schedule does not generate any sessions.')
    }

    this.assertStagesHaveSkills(data)

    return db.transaction(async (trx) => {
      const level = await Level.query({ client: trx })
        .where('id', data.levelId)
        .preload('schoolLevelSettings', (settingsQuery) =>
          settingsQuery.where('schoolId', school.id)
        )
        .firstOrFail()

      const setting = level.schoolLevelSettings?.[0]
      if (setting?.available === false) {
        throw new ClassAuthoringException('This program level is not available for this school.')
      }

      if (data.capacity > level.capacity) {
        throw new ClassAuthoringException('Class capacity cannot exceed the level capacity.')
      }

      const currentWeekdays = await SwimmingClassWeekday.query({ client: trx })
        .where('swimmingClassId', swimmingClass.id)
        .orderBy('weekday')
      const currentWeekdayValues = currentWeekdays.map((weekday) => weekday.weekday)
      const nextWeekdayValues = uniqueNumbers(data.weekdays).toSorted((a, b) => a - b)
      const scheduleChanged =
        swimmingClass.startDate.toISODate() !== data.startDate.toISODate() ||
        swimmingClass.endDate.toISODate() !== data.endDate.toISODate() ||
        swimmingClass.startTime !== data.startTime ||
        swimmingClass.endTime !== data.endTime ||
        currentWeekdayValues.join(',') !== nextWeekdayValues.join(',')

      const instructor = await this.resolveInstructor(school, data, trx)
      const availableSkillIds = await this.availableSkillIds(school, data, trx)

      swimmingClass.useTransaction(trx)
      swimmingClass.merge({
        levelId: level.id,
        code: data.code?.trim() ? data.code.trim().toUpperCase() : swimmingClass.code,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        startTime: data.startTime,
        endTime: data.endTime,
        capacity: data.capacity,
        location: data.location,
        instructorMembershipId: instructor.membershipId ?? null,
        pendingInstructorInvitationId: instructor.invitation?.id ?? null,
      })
      await swimmingClass.save()

      await SwimmingClassWeekday.query({ client: trx })
        .where('swimmingClassId', swimmingClass.id)
        .delete()
      await swimmingClass
        .related('weekdays')
        .createMany(nextWeekdayValues.map((weekday) => ({ weekday })))

      if (scheduleChanged) {
        const now = DateTime.now()
        await SwimmingClassSession.query({ client: trx })
          .where('swimmingClassId', swimmingClass.id)
          .where('startsAt', '>=', now.toSQL()!)
          .delete()
        await swimmingClass
          .related('sessions')
          .createMany(sessions.filter((session) => session.startsAt >= now))
      }

      const existingStages = await ClassStage.query({ client: trx }).where(
        'swimmingClassId',
        swimmingClass.id
      )
      const existingStageIds = existingStages.map((stage) => stage.id)
      if (existingStageIds.length > 0) {
        await ClassStageSkill.query({ client: trx })
          .whereIn('classStageId', existingStageIds)
          .delete()
      }
      await ClassStage.query({ client: trx }).where('swimmingClassId', swimmingClass.id).delete()

      for (const stageData of data.stages.toSorted((a, b) => a.position - b.position)) {
        const stage = await swimmingClass.related('stages').create({
          name: stageData.name,
          position: stageData.position,
        })
        const skillIds = await this.resolveStageSkillIds(
          school,
          manager,
          stageData,
          availableSkillIds,
          trx
        )
        await stage.related('classStageSkills').createMany(skillIds.map((skillId) => ({ skillId })))
      }

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

  async cancelSession(session: SwimmingClassSession): Promise<SwimmingClassSession> {
    session.cancel()
    await session.save()
    return session
  }

  protected assertStagesHaveSkills(data: StoreSwimmingClassInput | UpdateSwimmingClassInput) {
    const message = 'Every class needs at least one stage with at least one skill.'

    if (data.stages.length === 0) {
      throw new ClassAuthoringException(message)
    }

    for (const stage of data.stages) {
      const existingSkillCount = stage.skillIds?.length ?? 0
      const newSkillCount = stage.newSkills?.filter((skill) => skill.name.trim()).length ?? 0

      if (existingSkillCount + newSkillCount === 0) {
        throw new ClassAuthoringException(message)
      }
    }
  }

  protected async generateCode(school: School, trx: TransactionClientContract) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const code = `CLS-${string.random(6).toUpperCase()}`
      const existing = await SwimmingClass.query({ client: trx })
        .where('schoolId', school.id)
        .where('code', code)
        .first()

      if (!existing) {
        return code
      }
    }

    throw new ClassAuthoringException('Unable to generate a unique class code.')
  }

  protected async resolveInstructor(
    school: School,
    data: StoreSwimmingClassInput,
    trx: TransactionClientContract
  ): Promise<{ membershipId?: number; invitation?: Invitation }> {
    if (data.instructorMode === 'existing') {
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

  protected async availableSkillIds(
    school: School,
    data: StoreSwimmingClassInput,
    trx: TransactionClientContract
  ): Promise<Set<number>> {
    const requestedIds = uniqueNumbers(data.stages.flatMap((stage) => stage.skillIds ?? []))

    if (requestedIds.length === 0) {
      return new Set()
    }

    const skills = await Skill.query({ client: trx })
      .where((query) => {
        query.where('schoolId', school.id)

        if (school.organisation?.isPremium) {
          query.orWhere((defaultSkills) => {
            defaultSkills.whereNull('schoolId').where('isDefault', 1)
          })
        }
      })
      .whereIn('id', requestedIds)

    if (skills.length !== requestedIds.length) {
      throw new ClassAuthoringException('A selected skill is not available to this school.')
    }

    return new Set(requestedIds)
  }

  protected async resolveStageSkillIds(
    school: School,
    manager: User,
    stageData: StoreSwimmingClassInput['stages'][number],
    availableSkillIds: Set<number>,
    trx: TransactionClientContract
  ): Promise<number[]> {
    const existingSkillIds = uniqueNumbers(stageData.skillIds ?? [])
    for (const skillId of existingSkillIds) {
      if (!availableSkillIds.has(skillId)) {
        throw new ClassAuthoringException('A selected skill is not available to this school.')
      }
    }

    const createdSkills: Skill[] = []
    for (const skill of stageData.newSkills ?? []) {
      const createdSkill = new Skill()
      createdSkill.useTransaction(trx)
      createdSkill.merge({
        schoolId: school.id,
        name: skill.name,
        description: skill.description ?? null,
        isDefault: false,
        createdByUserId: manager.id,
      })
      await createdSkill.save()
      createdSkills.push(createdSkill)
    }

    return [...existingSkillIds, ...createdSkills.map((skill) => skill.id)]
  }
}
