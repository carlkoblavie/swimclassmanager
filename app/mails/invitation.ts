import { appUrl } from '#config/app'
import { BaseMail } from '@adonisjs/mail'
import router from '@adonisjs/core/services/router'

export default class InvitationMail extends BaseMail {
  constructor(
    private email: string,
    private token: string,
    private clubName: string,
    private roleName: string
  ) {
    super()
  }

  prepare() {
    const acceptUrl = router.makeUrl(
      'memberships.store',
      { token: this.token },
      { prefixUrl: appUrl }
    )

    this.message
      .to(this.email)
      .subject(`You've been invited to join ${this.clubName}`)
      .htmlView('emails/invitation_html', {
        acceptUrl,
        clubName: this.clubName,
        roleName: this.roleName,
      })
      .textView('emails/invitation_text', {
        acceptUrl,
        clubName: this.clubName,
        roleName: this.roleName,
      })
  }
}
