import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import Club from '#models/club'
import Signup from '#models/signup'
import SignupCaptureService from '#services/signup_capture_service'
import SignupTransformer from '#transformers/signup_transformer'
import { storeSignupValidator } from '#validators/signup'
import { Gender } from '#values/gender'

export default class SignupsController {
  async create({ params, inertia }: HttpContext) {
    const club = await Club.findByOrFail('slug', params.slug)

    return inertia.render('signups/create', {
      club: { name: club.name },
      slug: club.slug,
      genders: [Gender.MALE, Gender.FEMALE],
    })
  }

  @inject()
  async store(
    { params, request, response, session }: HttpContext,
    signupCapture: SignupCaptureService
  ) {
    const club = await Club.findByOrFail('slug', params.slug)
    const payload = await request.validateUsing(storeSignupValidator)

    await signupCapture.capture(club, payload)

    session.flash('success', 'Your sign-up has been received.')
    return response.redirect().toRoute('signups.create', { slug: club.slug })
  }

  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()

    const signups = await Signup.query()
      .where('clubId', user.activeClubId!)
      .preload('learners')
      .orderBy('created_at', 'desc')

    return inertia.render('signups/index', {
      signups: SignupTransformer.transform(signups),
    })
  }
}
