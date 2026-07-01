import { Form } from '@adonisjs/inertia/react'
import { type Data } from '@generated/data'
import { type InertiaProps } from '~/types'

type PageProps = InertiaProps<{
  account: Data.Account
}>

export default function CompleteProfile({ account }: PageProps) {
  return (
    <div className="form-container">
      <div>
        <h1> Complete your profile </h1>
        <p>Tell us a bit about you to finish setting up your account</p>
      </div>

      <div>
        <Form route="accounts.update">
          {({ errors, processing }) => (
            <>
              <div>
                <label htmlFor="fullName">Full name</label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  defaultValue={account.fullName ?? ''}
                  data-invalid={errors.fullName ? 'true' : undefined}
                />
                {errors.fullName && <div>{errors.fullName}</div>}
              </div>

              <div>
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  defaultValue={account.phone ?? ''}
                  data-invalid={errors.phone ? 'true' : undefined}
                />
                {errors.phone && <div>{errors.phone}</div>}
              </div>

              <div>
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  name="country"
                  id="country"
                  defaultValue={account.country ?? ''}
                  data-invalid={errors.country ? 'true' : undefined}
                />
                {errors.country && <div>{errors.country}</div>}
              </div>

              <div>
                <button type="submit" className="button" disabled={processing}>
                  Complete profile
                </button>
              </div>
            </>
          )}
        </Form>
      </div>
    </div>
  )
}
