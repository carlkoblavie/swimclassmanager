import { Form } from '@adonisjs/inertia/react'
import type { InertiaProps } from '~/types'

type PageProps = InertiaProps<{
  roles: string[]
}>

export default function CreateInvitation({ roles }: PageProps) {
  return (
    <div className="form-container">
      <div>
        <h1>Invite a member</h1>
        <p>Send an invitation by email and choose their role.</p>
      </div>

      <div>
        <Form route="invitations.store">
          {({ errors, processing }) => (
            <>
              <div>
                <label htmlFor="email">Email</label>
                <input
                  type="text"
                  name="email"
                  id="email"
                  data-invalid={errors.email ? 'true' : undefined}
                />
                {errors.email && <div>{errors.email}</div>}
              </div>

              <div>
                <label htmlFor="role">Role</label>
                <select name="role" id="role" data-invalid={errors.role ? 'true' : undefined}>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {errors.role && <div>{errors.role}</div>}
              </div>

              <div>
                <button type="submit" className="button" disabled={processing}>
                  Send invitation
                </button>
              </div>
            </>
          )}
        </Form>
      </div>
    </div>
  )
}
