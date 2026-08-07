import { useEffect, useRef, useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import StageBuilder, { type StageDraft } from '~/components/stage_builder'
import type { LevelDraft } from '~/components/level_form'
import { LevelFields, levelDraftFromLevel } from '~/components/program_level_add_form'

export default function ProgramStageAddForm({
  program,
  level,
  onCancel,
  onSuccess,
}: {
  program: Data.Program
  level: Data.Level
  onCancel: () => void
  onSuccess: () => void
}) {
  const [newStage, setNewStage] = useState<StageDraft | null>(null)
  const submitRef = useRef<HTMLButtonElement>(null)
  const levels = program.levels.map((candidate): LevelDraft => {
    const draft = levelDraftFromLevel(candidate)
    return candidate.id === level.id && newStage
      ? { ...draft, stages: [...draft.stages, newStage] }
      : draft
  })

  useEffect(() => {
    if (newStage) {
      submitRef.current?.click()
    }
  }, [newStage])

  return (
    <Form route="programs.update" routeParams={{ id: program.id }} onSuccess={onSuccess}>
      {() => (
        <>
          <input type="hidden" name="name" value={program.name} />
          <input type="hidden" name="description" value={program.description} />
          <input type="hidden" name="redirectTo" value="back" />
          {levels.map((candidate, index) => (
            <LevelFields
              key={`${candidate.id ?? 'new'}-${index}`}
              level={candidate}
              index={index}
            />
          ))}
          <StageBuilder
            nextPosition={level.stages.length + 1}
            onCancel={onCancel}
            onSave={setNewStage}
          />
          <button ref={submitRef} type="submit" hidden>
            Save
          </button>
        </>
      )}
    </Form>
  )
}
