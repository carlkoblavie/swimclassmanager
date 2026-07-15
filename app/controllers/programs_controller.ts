import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import Membership from '#models/membership'
import Program from '#models/program'
import { permissions } from '#start/permissions'
import ProgramAuthoringService from '#services/program_authoring_service'
import ProgramTransformer from '#transformers/program_transformer'
import { storeProgramValidator, updateProgramValidator } from '#validators/program'

export default class ProgramsController {
  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const schoolId = user.activeSchoolId!

    // Draft programs are hidden until active: only members with program.manage
    // see them (to prepare them for publishing).
    const membership = await Membership.query()
      .where('schoolId', schoolId)
      .where('userId', user.id)
      .first()
    const access = membership ? await permissions.createAccessFor(membership) : undefined
    const canManage = access?.allows('program.manage') ?? false

    const programs = await Program.query()
      .if(!canManage, (query) => query.withScopes((scopes) => scopes.active()))
      .preload('levels', (levelsQuery) =>
        levelsQuery
          .preload('schoolLevelSettings', (settingsQuery) =>
            settingsQuery.where('schoolId', schoolId)
          )
          .preload('stages', (stagesQuery) => stagesQuery.orderBy('position'))
          .orderBy('id')
      )
      .orderBy('name')

    return inertia.render('programs/index', {
      programs: ProgramTransformer.transform(programs, schoolId),
    })
  }

  create({ inertia }: HttpContext) {
    return inertia.render('programs/create', {})
  }

  @inject()
  async store({ request, response, session }: HttpContext, authoring: ProgramAuthoringService) {
    const payload = await request.validateUsing(storeProgramValidator)
    const program = await authoring.create(payload)

    // Programs are drafts until activated; publishing creates and activates in one step.
    if (request.input('intent') === 'publish') {
      await program.activate()
      session.flash('success', 'Program published.')
    } else {
      session.flash('success', 'Program created.')
    }

    return response.redirect().toRoute('programs.index')
  }

  async edit({ params, auth, inertia }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!

    const program = await Program.query()
      .where('id', params.id)
      .preload('levels', (levelsQuery) =>
        levelsQuery.preload('stages', (stagesQuery) => stagesQuery.orderBy('position')).orderBy('id')
      )
      .firstOrFail()

    return inertia.render('programs/edit', {
      program: ProgramTransformer.transform(program, schoolId).useVariant('forEdit'),
    })
  }

  @inject()
  async update(
    { params, request, response, session }: HttpContext,
    authoring: ProgramAuthoringService
  ) {
    const program = await Program.findOrFail(params.id)

    if (request.input('intent') === 'activate') {
      await program.activate()
      session.flash('success', 'Program activated.')
      return response.redirect().toRoute('programs.index')
    }

    const payload = await request.validateUsing(updateProgramValidator, {
      meta: { programId: program.id },
    })
    await authoring.update(program, payload)

    session.flash('success', 'Program updated.')
    return response.redirect().toRoute('programs.index')
  }

  async destroy({ params, response, session }: HttpContext) {
    const program = await Program.findOrFail(params.id)
    await program.delete()

    session.flash('success', 'Program removed.')
    return response.redirect().toRoute('programs.index')
  }
}
