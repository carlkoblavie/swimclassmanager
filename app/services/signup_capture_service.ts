import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'
import router from '@adonisjs/core/services/router'
import { appUrl } from '#config/app'
import Signup from '#models/signup'
import Membership from '#models/membership'
import SignupNotificationMail from '#mails/signup_notification'
import { RoleName } from '#values/role'
import type Club from '#models/club'
import type { Infer } from '@vinejs/vine/types'
import type { storeSignupValidator } from '#validators/signup'

type SignupInput = Infer<typeof storeSignupValidator>

export default class SignupCaptureService {
  /**
   * Capture a public sign-up for a club: persist the contact and its learners
   * in one transaction, then — after commit — notify the club's Administrator
   * and Head Coach by email.
   */
  async capture(club: Club, data: SignupInput): Promise<Signup> {
    const signup = await db.transaction(async (trx) => {
      const created = await Signup.create(
        {
          clubId: club.id,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          whatsapp: data.whatsapp ?? null,
          message: data.message ?? null,
        },
        { client: trx }
      )

      await created.related('learners').createMany(data.learners)

      return created
    })

    await signup.load('learners')

    const recipients = await this.recipientEmails(club)
    const listUrl = router.makeUrl('signups.index', {}, { prefixUrl: appUrl })

    for (const email of recipients) {
      await mail.sendLater(new SignupNotificationMail(email, club.name, signup, listUrl))
    }

    return signup
  }

  /**
   * Emails of the club's Administrator and Head Coach members.
   */
  private async recipientEmails(club: Club): Promise<string[]> {
    const memberships = await Membership.query()
      .where('clubId', club.id)
      .whereHas('roles', (roles) => {
        roles.whereIn('name', [RoleName.ADMINISTRATOR, RoleName.HEAD_COACH])
      })
      .preload('user')

    return memberships.map((membership) => membership.user.email)
  }
}
