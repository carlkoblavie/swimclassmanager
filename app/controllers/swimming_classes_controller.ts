import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import Level from '#models/level'
import Membership from '#models/membership'
import School from '#models/school'
import SwimmingClass from '#models/swimming_class'
import ClassSeriesAuthoringService from '#services/class_series_authoring_service'
import LevelTransformer from '#transformers/level_transformer'
import MembershipTransformer from '#transformers/membership_transformer'
import SwimmingClassTransformer from '#transformers/swimming_class_transformer'
import {
  storeSwimmingClassesValidator,
  updateSwimmingClassValidator,
} from '#validators/swimming_class'
import { RoleName } from '#values/role'

export default class SwimmingClassesController {
  /**
   * Display the school's day-based classes
   */
  async index({ auth, inertia }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const classes = await SwimmingClass.query()
      .where('schoolId', schoolId)
      .preload('level', (levelQuery) => levelQuery.preload('program'))
      .preload('levelStage')
      .preload('instructorMembership', (membershipQuery) =>
        membershipQuery.preload('user').preload('roles')
      )
      .preload('pendingInstructorInvitation')
      .preload('classSkills', (skillsQuery) => skillsQuery.preload('levelStageSkill'))
      .preload('lessons', (lessonsQuery) => lessonsQuery.orderBy('date'))
      .orderBy('weekday')
      .orderBy('startTime')

    return inertia.render('classes/index', {
      classes: SwimmingClassTransformer.transform(classes),
    })
  }

  /**
   * Create one class per submitted day (from the inline builder on programs)
   */
  @inject()
  async store(
    { auth, request, response, session }: HttpContext,
    authoring: ClassSeriesAuthoringService
  ) {
    const user = auth.getUserOrFail()
    const school = await School.findOrFail(user.activeSchoolId!)
    const payload = await request.validateUsing(storeSwimmingClassesValidator)

    const classes = await authoring.createMany(school, payload)

    session.flash(
      'success',
      classes.length === 1 ? 'Class created.' : `${classes.length} classes created.`
    )
    return response.redirect().toRoute('programs.index')
  }

  /**
   * Show a class with its planned lessons
   */
  async show({ auth, inertia, params }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const swimmingClass = await SwimmingClass.query()
      .where('id', params.id)
      .where('schoolId', schoolId)
      .preload('level', (levelQuery) => levelQuery.preload('program'))
      .preload('levelStage')
      .preload('instructorMembership', (membershipQuery) =>
        membershipQuery.preload('user').preload('roles')
      )
      .preload('pendingInstructorInvitation')
      .preload('classSkills', (skillsQuery) =>
        skillsQuery.preload('levelStageSkill', (skillQuery) => skillQuery.preload('activities'))
      )
      .preload('lessons', (lessonsQuery) =>
        lessonsQuery
          .preload('lessonActivities', (activitiesQuery) =>
            activitiesQuery.preload('levelStageActivity')
          )
          .orderBy('date')
      )
      .firstOrFail()

    return inertia.render('classes/show', {
      swimmingClass: SwimmingClassTransformer.transform(swimmingClass),
    })
  }

  /**
   * Edit a class: schedule, name, location, and instructor
   */
  async edit({ auth, inertia, params }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const swimmingClass = await SwimmingClass.query()
      .where('id', params.id)
      .where('schoolId', schoolId)
      .preload('level', (levelQuery) => levelQuery.preload('program'))
      .preload('levelStage')
      .preload('instructorMembership', (membershipQuery) =>
        membershipQuery.preload('user').preload('roles')
      )
      .preload('pendingInstructorInvitation')
      .preload('classSkills', (skillsQuery) => skillsQuery.preload('levelStageSkill'))
      .firstOrFail()

    // Stage and skill pickers need the level's curriculum tree.
    const level = await Level.query()
      .where('id', swimmingClass.levelId)
      .preload('program')
      .preload('schoolLevelSettings', (settingsQuery) => settingsQuery.where('schoolId', schoolId))
      .preload('stages', (stagesQuery) =>
        stagesQuery
          .preload('skills', (skillsQuery) => skillsQuery.preload('activities'))
          .orderBy('position')
      )
      .firstOrFail()

    const instructorMemberships = await Membership.query()
      .where('schoolId', schoolId)
      .whereHas('roles', (rolesQuery) => {
        rolesQuery.whereIn('name', [RoleName.TEACHER, RoleName.HEAD_COACH])
      })
      .preload('user')
      .preload('roles')
      .orderBy('id')

    return inertia.render('classes/edit', {
      swimmingClass: SwimmingClassTransformer.transform(swimmingClass),
      level: LevelTransformer.transform(level, schoolId),
      instructorOptions: MembershipTransformer.transform(instructorMemberships),
    })
  }

  /**
   * Update or cancel a class
   */
  @inject()
  async update(
    { auth, request, response, params, session }: HttpContext,
    authoring: ClassSeriesAuthoringService
  ) {
    const user = auth.getUserOrFail()
    const school = await School.findOrFail(user.activeSchoolId!)
    const swimmingClass = await SwimmingClass.query()
      .where('id', params.id)
      .where('schoolId', school.id)
      .firstOrFail()

    if (request.input('intent') === 'cancel') {
      await authoring.cancel(swimmingClass)
      session.flash('success', 'Class cancelled.')
      return response.redirect().toRoute('swimming_classes.show', { id: swimmingClass.id })
    }

    const payload = await request.validateUsing(updateSwimmingClassValidator)
    await authoring.update(swimmingClass, school, payload)

    session.flash(
      'success',
      payload.instructorMode === 'invite' ? 'Class updated. Teacher invited.' : 'Class updated.'
    )
    return response.redirect().toRoute('swimming_classes.show', { id: swimmingClass.id })
  }
}
