type Props = {
  index: number
  genders: string[]
  errors: Record<string, string>
  onRemove: () => void
}

export default function LearnerFields({ index, genders, errors, onRemove }: Props) {
  const name = (field: string) => `learners[${index}][${field}]`
  const error = (field: string) => errors[`learners.${index}.${field}`]

  return (
    <fieldset>
      <div>
        <label htmlFor={`learner-name-${index}`}>Learner name</label>
        <input
          type="text"
          id={`learner-name-${index}`}
          name={name('name')}
          data-invalid={error('name') ? 'true' : undefined}
        />
        {error('name') && <div>{error('name')}</div>}
      </div>

      <div>
        <label htmlFor={`learner-dob-${index}`}>Date of birth</label>
        <input
          type="date"
          id={`learner-dob-${index}`}
          name={name('dateOfBirth')}
          data-invalid={error('dateOfBirth') ? 'true' : undefined}
        />
        {error('dateOfBirth') && <div>{error('dateOfBirth')}</div>}
      </div>

      <div>
        <label htmlFor={`learner-gender-${index}`}>Gender</label>
        <select
          id={`learner-gender-${index}`}
          name={name('gender')}
          data-invalid={error('gender') ? 'true' : undefined}
        >
          {genders.map((gender) => (
            <option key={gender} value={gender}>
              {gender}
            </option>
          ))}
        </select>
        {error('gender') && <div>{error('gender')}</div>}
      </div>

      <div>
        <label htmlFor={`learner-nationality-${index}`}>Nationality</label>
        <input
          type="text"
          id={`learner-nationality-${index}`}
          name={name('nationality')}
          data-invalid={error('nationality') ? 'true' : undefined}
        />
        {error('nationality') && <div>{error('nationality')}</div>}
      </div>

      <div>
        <label htmlFor={`learner-location-${index}`}>Residential location</label>
        <input
          type="text"
          id={`learner-location-${index}`}
          name={name('residentialLocation')}
          data-invalid={error('residentialLocation') ? 'true' : undefined}
        />
        {error('residentialLocation') && <div>{error('residentialLocation')}</div>}
      </div>

      <div>
        <label htmlFor={`learner-medical-${index}`}>
          Medical information (enter None if there is nothing to report)
        </label>
        <textarea
          id={`learner-medical-${index}`}
          name={name('medicalInfo')}
          data-invalid={error('medicalInfo') ? 'true' : undefined}
        />
        {error('medicalInfo') && <div>{error('medicalInfo')}</div>}
      </div>

      <div>
        <label htmlFor={`learner-experience-${index}`}>Swimming experience (optional)</label>
        <textarea id={`learner-experience-${index}`} name={name('swimmingExperience')} />
        {error('swimmingExperience') && <div>{error('swimmingExperience')}</div>}
      </div>

      <button type="button" onClick={onRemove}>
        Remove learner
      </button>
    </fieldset>
  )
}
