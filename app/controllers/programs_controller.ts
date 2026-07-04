import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import Program from '#models/program'
import ProgramAuthoringService from '#services/program_authoring_service'
import ProgramTransformer from '#transformers/program_transformer'
import { storeProgramValidator, updateProgramValidator } from '#validators/program'

export default class ProgramsController {
  async index({ auth, inertia }: HttpContext) {
    const clubId = auth.getUserOrFail().activeClubId!

    const programs = await Program.query()
      .preload('levels', (levelsQuery) =>
        levelsQuery
          .preload('clubLevelSettings', (settingsQuery) => settingsQuery.where('clubId', clubId))
          .orderBy('id')
      )
      .orderBy('name')

    return inertia.render('programs/index', {
      programs: ProgramTransformer.transform(programs, clubId),
    })
  }

  create({ inertia }: HttpContext) {
    return inertia.render('programs/create', {})
  }

  @inject()
  async store({ request, response, session }: HttpContext, authoring: ProgramAuthoringService) {
    const payload = await request.validateUsing(storeProgramValidator)
    await authoring.create(payload)

    session.flash('success', 'Program created.')
    return response.redirect().toRoute('programs.index')
  }

  async edit({ params, auth, inertia }: HttpContext) {
    const clubId = auth.getUserOrFail().activeClubId!

    const program = await Program.query()
      .where('id', params.id)
      .preload('levels', (levelsQuery) => levelsQuery.orderBy('id'))
      .firstOrFail()

    return inertia.render('programs/edit', {
      program: ProgramTransformer.transform(program, clubId).useVariant('forEdit'),
    })
  }

  @inject()
  async update(
    { params, request, response, session }: HttpContext,
    authoring: ProgramAuthoringService
  ) {
    const program = await Program.findOrFail(params.id)
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
