import { Form } from '@adonisjs/inertia/react'

export default function CreateClub() {
  return (
    <div className="form-container">
      <div>
        <h1>Create a club</h1>
        <p>Set up a club to get started.</p>
      </div>

      <div>
        <Form route="clubs.store">
          {({ errors, processing }) => (
            <>
              <div>
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  data-invalid={errors.name ? 'true' : undefined}
                />
                {errors.name && <div>{errors.name}</div>}
              </div>

              <div>
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  data-invalid={errors.location ? 'true' : undefined}
                />
                {errors.location && <div>{errors.location}</div>}
              </div>

              <div>
                <button type="submit" className="button" disabled={processing}>
                  Create club
                </button>
              </div>
            </>
          )}
        </Form>
      </div>
    </div>
  )
}
