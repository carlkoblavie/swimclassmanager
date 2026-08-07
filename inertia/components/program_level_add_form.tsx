import { Fragment, useEffect, useRef, useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import LevelForm, { type LevelDraft } from '~/components/level_form'

export function levelDraftFromLevel(level: Data.Level): LevelDraft {
  return {
    id: level.id,
    code: level.code,
    name: level.name,
    ageGroup: level.ageGroup,
    description: level.description,
    defaultFee: String(level.defaultFee.raw / 100),
    classesCount: String(level.classesCount ?? ''),
    audience: level.audience,
    stages: level.stages.map((stage) => ({
      id: stage.id,
      code: stage.code,
      name: stage.name,
      position: String(stage.position),
      classesCount: String(stage.classesCount ?? ''),
      description: stage.description ?? '',
      skills: stage.skills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        passCriteria: skill.passCriteria,
        description: skill.description ?? '',
        activities: skill.activities.map((activity) => ({
          id: activity.id,
          name: activity.name,
          description: activity.description ?? '',
          applicationNotes: activity.applicationNotes ?? '',
        })),
      })),
    })),
  }
}

export function LevelFields({ level, index }: { level: LevelDraft; index: number }) {
  return (
    <Fragment>
      {level.id !== undefined && (
        <input type="hidden" name={`levels[${index}][id]`} value={level.id} />
      )}
      <input type="hidden" name={`levels[${index}][name]`} value={level.name} />
      <input type="hidden" name={`levels[${index}][ageGroup]`} value={level.ageGroup} />
      <input type="hidden" name={`levels[${index}][description]`} value={level.description} />
      <input type="hidden" name={`levels[${index}][defaultFee]`} value={level.defaultFee} />
      <input type="hidden" name={`levels[${index}][classesCount]`} value={level.classesCount} />
      <input type="hidden" name={`levels[${index}][audience]`} value={level.audience} />
      {level.stages.map((stage, stageIndex) => {
        const prefix = `levels[${index}][stages][${stageIndex}]`

        return (
          <Fragment key={stageIndex}>
            {stage.id !== undefined && (
              <input type="hidden" name={`${prefix}[id]`} value={stage.id} />
            )}
            <input type="hidden" name={`${prefix}[name]`} value={stage.name} />
            <input type="hidden" name={`${prefix}[position]`} value={stage.position} />
            <input type="hidden" name={`${prefix}[classesCount]`} value={stage.classesCount} />
            <input type="hidden" name={`${prefix}[description]`} value={stage.description} />
            {stage.skills.map((skill, skillIndex) => {
              const skillPrefix = `${prefix}[skills][${skillIndex}]`

              return (
                <Fragment key={skillIndex}>
                  {skill.id !== undefined && (
                    <input type="hidden" name={`${skillPrefix}[id]`} value={skill.id} />
                  )}
                  {skill.familyKey && (
                    <input
                      type="hidden"
                      name={`${skillPrefix}[familyKey]`}
                      value={skill.familyKey}
                    />
                  )}
                  <input type="hidden" name={`${skillPrefix}[name]`} value={skill.name} />
                  <input
                    type="hidden"
                    name={`${skillPrefix}[passCriteria]`}
                    value={skill.passCriteria}
                  />
                  <input
                    type="hidden"
                    name={`${skillPrefix}[description]`}
                    value={skill.description}
                  />
                  {skill.activities.map((activity, activityIndex) => {
                    const activityPrefix = `${skillPrefix}[activities][${activityIndex}]`

                    return (
                      <Fragment key={activityIndex}>
                        {activity.id !== undefined && (
                          <input type="hidden" name={`${activityPrefix}[id]`} value={activity.id} />
                        )}
                        <input
                          type="hidden"
                          name={`${activityPrefix}[name]`}
                          value={activity.name}
                        />
                        <input
                          type="hidden"
                          name={`${activityPrefix}[description]`}
                          value={activity.description}
                        />
                        <input
                          type="hidden"
                          name={`${activityPrefix}[applicationNotes]`}
                          value={activity.applicationNotes}
                        />
                      </Fragment>
                    )
                  })}
                </Fragment>
              )
            })}
          </Fragment>
        )
      })}
    </Fragment>
  )
}

export default function ProgramLevelAddForm({
  program,
  onCancel,
  onSuccess,
}: {
  program: Data.Program
  onCancel: () => void
  onSuccess: () => void
}) {
  const [newLevel, setNewLevel] = useState<LevelDraft | null>(null)
  const submitRef = useRef<HTMLButtonElement>(null)
  const levels = [...program.levels.map(levelDraftFromLevel), ...(newLevel ? [newLevel] : [])]

  useEffect(() => {
    if (newLevel) {
      submitRef.current?.click()
    }
  }, [newLevel])

  return (
    <Form route="programs.update" routeParams={{ id: program.id }} onSuccess={onSuccess}>
      {() => (
        <>
          <input type="hidden" name="name" value={program.name} />
          <input type="hidden" name="description" value={program.description} />
          <input type="hidden" name="redirectTo" value="back" />
          {levels.map((level, index) => (
            <LevelFields key={`${level.id ?? 'new'}-${index}`} level={level} index={index} />
          ))}
          <LevelForm onCancel={onCancel} onSave={setNewLevel} />
          <button ref={submitRef} type="submit" hidden>
            Save
          </button>
        </>
      )}
    </Form>
  )
}
