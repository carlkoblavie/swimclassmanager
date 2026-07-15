import type { HttpContext } from '@adonisjs/core/http'
import Membership from '#models/membership'
import { updateActiveSchoolValidator } from '#validators/active_school'

export default class ActiveSchoolsController {
  async update({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const { schoolId } = await request.validateUsing(updateActiveSchoolValidator)

    const membership = await Membership.query()
      .where('userId', user.id)
      .where('schoolId', schoolId)
      .preload('school')
      .first()

    if (!membership) {
      session.flash('error', 'You are not a member of that school.')
      return response.redirect().back()
    }

    user.activeOrganisationId = membership.school.organisationId
    user.activeSchoolId = membership.schoolId
    await user.save()

    session.flash('success', `Switched to ${membership.school.name}.`)
    return response.redirect().toRoute('home')
  }
}
