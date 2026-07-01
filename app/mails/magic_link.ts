import { appUrl } from '#config/app'
import { BaseMail } from '@adonisjs/mail'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'

export default class MagicLinkMail extends BaseMail {
  subject = 'Your sign-in link'

  constructor(private email: string) {
    super()
  }

  prepare() {
    const verifyUrl = signedUrlFor('auth.verify', [], {
      expiresIn: '15 minutes',
      prefixUrl: appUrl,
      qs: { email: this.email },
    })

    this.message
      .to(this.email)
      .htmlView('emails/magic_link_html', { verifyUrl })
      .textView('emails/magic_link_text', { verifyUrl })
  }
}
