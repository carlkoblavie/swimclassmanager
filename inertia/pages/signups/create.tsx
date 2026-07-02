import { useRef, useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import type { InertiaProps } from '~/types'
import LearnerFields from '~/components/learner_fields'

type PageProps = InertiaProps<{
  club: { name: string }
  slug: string
  genders: string[]
}>

export default function RegisterLearner({ club, slug, genders }: PageProps) {
  const [rows, setRows] = useState<number[]>([0])
  const nextId = useRef(1)

  const addLearner = () => setRows((current) => [...current, nextId.current++])
  const removeLearner = (id: number) => setRows((current) => current.filter((row) => row !== id))

  return (
    <div className="form-container">
      <div>
        <h1>Sign up with {club.name}</h1>
        <p>Register a learner for lessons — no account needed.</p>
      </div>

      <Form route="signups.store" routeParams={{ slug }}>
        {({ errors, processing }) => (
          <>
            <h2>Your details</h2>

            <div>
              <label htmlFor="contactName">Your name</label>
              <input
                type="text"
                name="contactName"
                id="contactName"
                data-invalid={errors.contactName ? 'true' : undefined}
              />
              {errors.contactName && <div>{errors.contactName}</div>}
            </div>

            <div>
              <label htmlFor="contactEmail">Email</label>
              <input
                type="text"
                name="contactEmail"
                id="contactEmail"
                data-invalid={errors.contactEmail ? 'true' : undefined}
              />
              {errors.contactEmail && <div>{errors.contactEmail}</div>}
            </div>

            <div>
              <label htmlFor="contactPhone">Phone</label>
              <input
                type="text"
                name="contactPhone"
                id="contactPhone"
                data-invalid={errors.contactPhone ? 'true' : undefined}
              />
              {errors.contactPhone && <div>{errors.contactPhone}</div>}
            </div>

            <div>
              <label htmlFor="whatsapp">WhatsApp number (optional)</label>
              <input type="text" name="whatsapp" id="whatsapp" />
              {errors.whatsapp && <div>{errors.whatsapp}</div>}
            </div>

            <h2>Learners</h2>

            {rows.map((id, index) => (
              <LearnerFields
                key={id}
                index={index}
                genders={genders}
                errors={errors}
                onRemove={() => removeLearner(id)}
              />
            ))}

            {errors.learners && <div>{errors.learners}</div>}

            <button type="button" onClick={addLearner}>
              Add another learner
            </button>

            <h2>Anything else?</h2>

            <div>
              <label htmlFor="message">Message (optional)</label>
              <textarea name="message" id="message" />
              {errors.message && <div>{errors.message}</div>}
            </div>

            <div>
              <button type="submit" className="button" disabled={processing}>
                Submit sign-up
              </button>
            </div>
          </>
        )}
      </Form>
    </div>
  )
}
