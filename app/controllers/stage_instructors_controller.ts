import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import School from '#models/school'
import StageInstructorService from '#services/stage_instructor_service'
import { assignStageInstructorsValidator } from '#validators/swimming_class'

export default class StageInstructorsController {
  /** Assign a school's lead and assistant instructors to a curriculum stage. */
  @inject()
  async update({ auth, request, response, session }: HttpContext, service: StageInstructorService) {
    const school = await School.findOrFail(auth.getUserOrFail().activeSchoolId!)
    const payload = await request.validateUsing(assignStageInstructorsValidator)
    await service.assign(school, payload)

    session.flash('success', 'Stage instructors updated.')
    return response.redirect().back()
  }
}
