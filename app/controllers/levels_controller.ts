import type { HttpContext } from '@adonisjs/core/http'
import Level from '#models/level'
import Membership from '#models/membership'
import SwimmingClass from '#models/swimming_class'
import { permissions } from '#start/permissions'
import LevelTransformer from '#transformers/level_transformer'
import SwimmingClassTransformer from '#transformers/swimming_class_transformer'

export default class LevelsController {
  async show({ auth, inertia, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const schoolId = user.activeSchoolId!

    const membership = await Membership.query()
      .where('schoolId', schoolId)
      .where('userId', user.id)
      .first()
    const access = membership ? await permissions.createAccessFor(membership) : undefined
    const canManage = access?.allows('program.manage') ?? false
    const canViewClasses = access?.allows('class.view') ?? false

    // Levels of draft programs stay hidden until the program is active,
    // matching the programs list.
    const level = await Level.query()
      .where('id', params.id)
      .if(!canManage, (query) =>
        query.whereHas('program', (programQuery) => programQuery.whereNotNull('activatedAt'))
      )
      .preload('program')
      .preload('schoolLevelSettings', (settingsQuery) => settingsQuery.where('schoolId', schoolId))
      .preload('stages', (stagesQuery) =>
        stagesQuery
          .preload('skills', (skillsQuery) => skillsQuery.preload('activities'))
          .orderBy('position')
      )
      .firstOrFail()

    const classes = canViewClasses
      ? await SwimmingClass.query()
          .where('schoolId', schoolId)
          .where('levelId', level.id)
          .preload('level', (levelQuery) => levelQuery.preload('program'))
          .preload('term', (termQuery) => termQuery.preload('swimYear'))
          .preload('levelStage')
          .preload('instructorMembership', (membershipQuery) =>
            membershipQuery.preload('user').preload('roles')
          )
          .preload('pendingInstructorInvitation')
          .preload('classSkills', (skillsQuery) => skillsQuery.preload('levelStageSkill'))
          .preload('lessons', (lessonsQuery) => lessonsQuery.orderBy('date'))
          .orderBy('weekday')
          .orderBy('startTime')
      : []

    return inertia.render('levels/show', {
      level: LevelTransformer.transform(level, schoolId).useVariant('forClassOption'),
      classes: SwimmingClassTransformer.transform(classes),
    })
  }
}
