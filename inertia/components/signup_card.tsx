import type { Data } from '@generated/data'

type Props = {
  signup: Data.Signup
}

export default function SignupCard({ signup }: Props) {
  const learners = signup.learners ?? []

  return (
    <article>
      <h2>{signup.contactName}</h2>
      <p>{signup.contactEmail}</p>
      <p>{signup.contactPhone}</p>
      {signup.whatsapp && <p>WhatsApp: {signup.whatsapp}</p>}
      {signup.message && <p>{signup.message}</p>}
      <p>Received {signup.createdAt.formatted}</p>

      <h3>Learners</h3>
      <ul>
        {learners.map((learner) => (
          <li key={learner.id}>
            <strong>{learner.name}</strong> — {learner.dateOfBirth.formatted} — {learner.gender}
            <br />
            Nationality: {learner.nationality}
            <br />
            Residential location: {learner.residentialLocation}
            <br />
            Medical information: {learner.medicalInfo}
            {learner.swimmingExperience && (
              <>
                <br />
                Swimming experience: {learner.swimmingExperience}
              </>
            )}
          </li>
        ))}
      </ul>
    </article>
  )
}
