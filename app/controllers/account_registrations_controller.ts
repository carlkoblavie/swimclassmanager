import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import User from '#models/user'
import SchoolFoundingService from '#services/school_founding_service'
import {
  storeAccountRegistrationValidator,
  storeApiAccountValidator,
} from '#validators/account_registration'
import type { HttpContext } from '@adonisjs/core/http'

const WAITLIST_DEFAULT_PASSWORD = 'Welcome1234!!'

export default class AccountRegistrationsController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/signup', {})
  }

  @inject()
  async store(
    { request, response, session }: HttpContext,
    schoolFounding: SchoolFoundingService
  ) {
    const payload = await request.validateUsing(storeAccountRegistrationValidator)
    const user = await User.create({
      email: payload.email,
      fullName: `${payload.firstName} ${payload.lastName}`,
      phone: payload.phone,
      password: WAITLIST_DEFAULT_PASSWORD,
      profileCompletedAt: DateTime.now(),
      mustChangePassword: true,
    })

    const school = await schoolFounding.foundFirstSchool(user, {
      organisationName: payload.organisationName,
      schoolName: payload.organisationName,
      location: payload.location,
    })

    session.flash('success', `${school.name} has joined the waitlist.`)
    return response.redirect().toRoute('account_registrations.create')
  }

  /**
   * Programmatic account creation (JSON). Same self-serve flow as the web
   * signup — creates the admin user with an email/password credential and
   * founds their first school — but returns JSON and does not open a session.
   */
  @inject()
  async storeApi({ request, response }: HttpContext, schoolFounding: SchoolFoundingService) {
    const payload = await request.validateUsing(storeApiAccountValidator)
    const user = await User.create({
      email: payload.email,
      fullName: `${payload.firstName} ${payload.lastName}`,
      phone: payload.phone,
      password: payload.password,
      profileCompletedAt: DateTime.now(),
    })

    const school = await schoolFounding.foundFirstSchool(user, {
      organisationName: payload.organisationName,
      schoolName: payload.organisationName,
      location: payload.location,
    })

    return response.created({
      account: {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        organisationName: payload.organisationName,
        school: school.name,
      },
    })
  }
}
