import { usePage } from '@inertiajs/react'
import { type ReactNode } from 'react'

/**
 * Renders its children only when the current user holds the given permission
 * key. Reads the `userPermissions` shared prop.
 */
export function Guard({ for: action, children }: { for: string; children: ReactNode }) {
  const { userPermissions } = usePage<{ userPermissions?: string[] }>().props

  if (!(userPermissions ?? []).includes(action)) {
    return null
  }

  return <>{children}</>
}
