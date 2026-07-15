import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import Level from '#models/level'
import Membership from '#models/membership'
import School from '#models/school'
import Skill from '#models/skill'
import SwimmingClass from '#models/swimming_class'
import ClassSeriesAuthoringService from '#services/class_series_authoring_service'
import LevelTransformer from '#transformers/level_transformer'
import MembershipTransformer from '#transformers/membership_transformer'
import SkillTransformer from '#transformers/skill_transformer'
import SwimmingClassTransformer from '#transformers/swimming_class_transformer'
import {
  storeSwimmingClassValidator,
  updateSwimmingClassValidator,
} from '#validators/swimming_class'
import { RoleName } from '#values/role'

export default class SwimmingClassesController {
  /**
   * Display a list of resource
   */
  async index({ auth, inertia }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const classes = await SwimmingClass.query()
      .where('schoolId', schoolId)
      .preload('level', (levelQuery) => levelQuery.preload('program'))
      .preload('instructorMembership', (membershipQuery) =>
        membershipQuery.preload('user').preload('roles')
      )
      .preload('pendingInstructorInvitation')
      .preload('sessions', (sessionsQuery) => sessionsQuery.orderBy('startsAt'))
      .orderBy('startDate')

    return inertia.render('classes/index', {
      classes: SwimmingClassTransformer.transform(classes),
    })
  }

  /**
   * Display form to create a new record
   */
  async create({ auth, inertia, request }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!

    const school = await School.query().where('id', schoolId).preload('organisation').firstOrFail()

    const levels = await Level.query()
      .whereHas('program', (programQuery) => programQuery.whereNotNull('activatedAt'))
      .preload('program')
      .preload('schoolLevelSettings', (settingsQuery) => settingsQuery.where('schoolId', schoolId))
      .orderBy('name')

    const availableLevels = levels.filter((level) => {
      const setting = level.schoolLevelSettings?.[0]
      return setting?.available ?? true
    })

    const requestedLevelId = Number(request.input('levelId'))
    const preselectedLevelId = availableLevels.some((level) => level.id === requestedLevelId)
      ? requestedLevelId
      : undefined

    const instructorMemberships = await Membership.query()
      .where('schoolId', schoolId)
      .whereHas('roles', (rolesQuery) => {
        rolesQuery.whereIn('name', [RoleName.TEACHER, RoleName.HEAD_COACH])
      })
      .preload('user')
      .preload('roles')
      .orderBy('id')

    const skills = await Skill.query()
      .withScopes((scopes) => scopes.availableToSchool(school))
      .orderBy('name')

    return inertia.render('classes/create', {
      levelOptions: LevelTransformer.transform(availableLevels, schoolId).useVariant(
        'forClassOption'
      ),
      instructorOptions: MembershipTransformer.transform(instructorMemberships),
      skillOptions: SkillTransformer.transform(skills),
      preselectedLevelId,
    })
  }

  /**
   * Handle form submission for the create action
   */
  @inject()
  async store(
    { auth, request, response, session }: HttpContext,
    authoring: ClassSeriesAuthoringService
  ) {
    const user = auth.getUserOrFail()
    const school = await School.query()
      .where('id', user.activeSchoolId!)
      .preload('organisation')
      .firstOrFail()
    const payload = await request.validateUsing(storeSwimmingClassValidator, {
      meta: { schoolId: school.id },
    })

    const swimmingClass = await authoring.create(school, user, payload)

    session.flash(
      'success',
      payload.instructorMode === 'invite' ? 'Class created. Teacher invited.' : 'Class created.'
    )

    return response.redirect().toRoute('swimming_classes.show', { id: swimmingClass.id })
  }

  /**
   * Show individual record
   */
  async show({ auth, inertia, params }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const swimmingClass = await SwimmingClass.query()
      .where('id', params.id)
      .where('schoolId', schoolId)
      .preload('level', (levelQuery) => levelQuery.preload('program'))
      .preload('instructorMembership', (membershipQuery) =>
        membershipQuery.preload('user').preload('roles')
      )
      .preload('pendingInstructorInvitation')
      .preload('stages', (stagesQuery) => stagesQuery.preload('skills').orderBy('position'))
      .preload('sessions', (sessionsQuery) => sessionsQuery.orderBy('startsAt'))
      .firstOrFail()

    return inertia.render('classes/show', {
      swimmingClass: SwimmingClassTransformer.transform(swimmingClass),
    })
  }

  /**
   * Edit individual record
   */
  async edit({ auth, inertia, params }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const school = await School.query().where('id', schoolId).preload('organisation').firstOrFail()

    const swimmingClass = await SwimmingClass.query()
      .where('id', params.id)
      .where('schoolId', schoolId)
      .preload('level', (levelQuery) => levelQuery.preload('program'))
      .preload('instructorMembership', (membershipQuery) =>
        membershipQuery.preload('user').preload('roles')
      )
      .preload('pendingInstructorInvitation')
      .preload('weekdays')
      .preload('stages', (stagesQuery) => stagesQuery.preload('skills').orderBy('position'))
      .preload('sessions', (sessionsQuery) => sessionsQuery.orderBy('startsAt'))
      .firstOrFail()

    const levels = await Level.query()
      .whereHas('program', (programQuery) => programQuery.whereNotNull('activatedAt'))
      .preload('program')
      .preload('schoolLevelSettings', (settingsQuery) => settingsQuery.where('schoolId', schoolId))
      .orderBy('name')

    const availableLevels = levels.filter((level) => {
      const setting = level.schoolLevelSettings?.[0]
      return setting?.available ?? true
    })

    const instructorMemberships = await Membership.query()
      .where('schoolId', schoolId)
      .whereHas('roles', (rolesQuery) => {
        rolesQuery.whereIn('name', [RoleName.TEACHER, RoleName.HEAD_COACH])
      })
      .preload('user')
      .preload('roles')
      .orderBy('id')

    const skills = await Skill.query()
      .withScopes((scopes) => scopes.availableToSchool(school))
      .orderBy('name')

    const weekdays = swimmingClass.$preloaded.weekdays as unknown as { weekday: number }[]
    const stages = swimmingClass.$preloaded.stages as unknown as {
      id: number
      name: string
      position: number
      $preloaded: { skills?: Skill[] }
    }[]
    const pendingInvitation = swimmingClass.$preloaded.pendingInstructorInvitation as unknown as
      | { inviteeName?: string | null; inviteePhone?: string | null; email: string }
      | undefined

    return inertia.render('classes/edit', {
      swimmingClass: SwimmingClassTransformer.transform(swimmingClass),
      levelOptions: LevelTransformer.transform(availableLevels, schoolId).useVariant(
        'forClassOption'
      ),
      instructorOptions: MembershipTransformer.transform(instructorMemberships),
      skillOptions: SkillTransformer.transform(skills),
      initial: {
        code: swimmingClass.code,
        name: swimmingClass.name,
        levelId: swimmingClass.levelId,
        startDate: swimmingClass.startDate.toISODate() ?? undefined,
        endDate: swimmingClass.endDate.toISODate() ?? undefined,
        weekdays: weekdays.map((weekday) => weekday.weekday),
        startTime: swimmingClass.startTime,
        endTime: swimmingClass.endTime,
        capacity: swimmingClass.capacity,
        location: swimmingClass.location,
        instructorMode: swimmingClass.pendingInstructorInvitationId ? 'invite' : 'existing',
        instructorMembershipId: swimmingClass.instructorMembershipId ?? undefined,
        inviteTeacherName: pendingInvitation?.inviteeName ?? undefined,
        inviteTeacherPhone: pendingInvitation?.inviteePhone ?? undefined,
        inviteTeacherEmail: pendingInvitation?.email,
        stages: stages.map((stage) => ({
          id: stage.id,
          name: stage.name,
          position: stage.position,
          skillIds: (stage.$preloaded.skills ?? []).map((skill) => skill.id),
          newSkills: [],
        })),
      },
    })
  }

  /**
   * Handle form submission for the edit action
   */
  @inject()
  async update(
    { auth, request, response, params, session }: HttpContext,
    authoring: ClassSeriesAuthoringService
  ) {
    const user = auth.getUserOrFail()
    const school = await School.query()
      .where('id', user.activeSchoolId!)
      .preload('organisation')
      .firstOrFail()
    const swimmingClass = await SwimmingClass.query()
      .where('id', params.id)
      .where('schoolId', school.id)
      .firstOrFail()

    if (request.input('intent') === 'cancel') {
      await authoring.cancel(swimmingClass)
      session.flash('success', 'Class cancelled.')
      return response.redirect().toRoute('swimming_classes.show', { id: swimmingClass.id })
    }

    const payload = await request.validateUsing(updateSwimmingClassValidator, {
      meta: { schoolId: school.id, classId: swimmingClass.id },
    })

    await authoring.update(swimmingClass, school, user, payload)

    session.flash(
      'success',
      payload.instructorMode === 'invite' ? 'Class updated. Teacher invited.' : 'Class updated.'
    )

    return response.redirect().toRoute('swimming_classes.show', { id: swimmingClass.id })
  }

  /**
   * Delete record
   */
  async destroy({}: HttpContext) {}
}
