import { urlFor } from '~/client'

type Props = {
  slug: string
}

export default function ShareSignupLink({ slug }: Props) {
  const path = urlFor('signups.create', { slug })

  const copy = () => {
    void navigator.clipboard.writeText(`${window.location.origin}${path}`)
  }

  return (
    <div>
      <p>Share your learn-to-swim sign-up link:</p>
      <code>{path}</code>
      <button type="button" onClick={copy}>
        Copy link
      </button>
    </div>
  )
}
