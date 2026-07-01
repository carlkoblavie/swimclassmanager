import { Form } from '@adonisjs/inertia/react'

export default function Login() {
  return (
    <div className="form-container">
      <div>
        <h1> Sign in </h1>
        <p>Enter your email and we&apos;ll send you a sign-in link</p>
      </div>

      <div>
        <Form route="sign_in_links.store">
          {({ errors, processing }) => (
            <>
              <div>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="email"
                  data-invalid={errors.email ? 'true' : undefined}
                />
                {errors.email && <div>{errors.email}</div>}
              </div>

              <div>
                <button type="submit" className="button" disabled={processing}>
                  Send sign-in link
                </button>
              </div>
            </>
          )}
        </Form>
      </div>
    </div>
  )
}
