import { Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import SignupCard from '~/components/signup_card'

type PageProps = InertiaProps<{
  signups: Data.Signup[]
}>

export default function SignupsIndex({ signups }: PageProps) {
  return (
    <div>
      <h1>Sign-ups</h1>
      <Link route="home">Back to dashboard</Link>

      {signups.length === 0 ? (
        <p>No sign-ups yet.</p>
      ) : (
        signups.map((signup) => <SignupCard key={signup.id} signup={signup} />)
      )}
    </div>
  )
}
