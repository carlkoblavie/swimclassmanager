import type { HttpContext } from '@adonisjs/core/http'
import Level from '#models/level'
import ClubLevelSetting from '#models/club_level_setting'
import { updateLevelSettingsValidator } from '#validators/level_setting'

export default class LevelSettingsController {
  async update({ params, auth, request, response, session }: HttpContext) {
    const clubId = auth.getUserOrFail().activeClubId!
    const level = await Level.findOrFail(params.id)
    const { fee, available } = await request.validateUsing(updateLevelSettingsValidator)

    await ClubLevelSetting.updateOrCreate(
      { clubId, levelId: level.id },
      { fee: fee === null ? null : Math.round(fee * 100), available }
    )

    session.flash('success', 'Level settings updated.')
    return response.redirect().toRoute('programs.index')
  }
}
