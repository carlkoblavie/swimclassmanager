import { Link } from '@adonisjs/inertia/react'
import type { InertiaProps } from '~/types'
import { Guard } from '~/utils/permissions'

export default function Home({ activeClub }: InertiaProps) {
  return (
    <div className="hero">
      {activeClub && (
        <>
          <h1>{activeClub.name}</h1>
          <p>{activeClub.location}</p>
        </>
      )}

      <Guard for="invitation.create">
        <Link route="invitations.create">Invite member</Link>
      </Guard>

      <Link route="clubs.create">Create a club</Link>
    </div>
  )
}
