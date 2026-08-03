import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import BankPackService from '#services/bank_pack_service'

export default class BankPacksController {
  @inject()
  async index({ auth, inertia }: HttpContext, packs: BankPackService) {
    const schoolId = auth.getUserOrFail().activeSchoolId!

    return inertia.render('banks/packs', {
      packs: await packs.forSchool(schoolId),
    })
  }

  @inject()
  async update({ auth, params, response, session }: HttpContext, packs: BankPackService) {
    const schoolId = auth.getUserOrFail().activeSchoolId!

    await packs.enablePack(schoolId, Number(params.id))

    session.flash('success', 'Bank pack enabled and synced.')
    return response.redirect().toRoute('bank_packs.index')
  }
}
