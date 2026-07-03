import { BaseMail } from '@adonisjs/mail'
import type Signup from '#models/signup'

export default class SignupNotificationMail extends BaseMail {
  constructor(
    private recipientEmail: string,
    private clubName: string,
    private signup: Signup,
    private listUrl: string
  ) {
    super()
  }

  prepare() {
    const learners = this.signup.learners.map((learner) => ({
      name: `${learner.firstName} ${learner.lastName}`,
      dateOfBirth: learner.dateOfBirth.toFormat('dd LLL yyyy'),
      gender: learner.gender,
      nationality: learner.nationality,
      residentialLocation: learner.residentialLocation,
      medicalInfo: learner.medicalInfo,
      swimmingExperience: learner.swimmingExperience,
    }))

    const data = {
      clubName: this.clubName,
      listUrl: this.listUrl,
      contactName: this.signup.contactName,
      contactEmail: this.signup.contactEmail,
      contactPhone: this.signup.contactPhone,
      whatsapp: this.signup.whatsapp,
      message: this.signup.message,
      learners,
    }

    this.message
      .to(this.recipientEmail)
      .subject(`New learn-to-swim sign-up for ${this.clubName}`)
      .htmlView('emails/signup_notification_html', data)
      .textView('emails/signup_notification_text', data)
  }
}
