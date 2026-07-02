import { Link } from '@adonisjs/inertia/react'
import type { InertiaProps } from '~/types'

export default function Home({ activeClub }: InertiaProps) {
  return (
    <div className="hero">
      {activeClub && (
        <>
          <h1>{activeClub.name}</h1>
          <p>{activeClub.location}</p>
        </>
      )}

      <Link route="clubs.create">Create a club</Link>
    </div>
  )
}
