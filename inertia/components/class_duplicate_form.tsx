import { useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import { Button, Card, Divider, Group, NativeSelect, Stack, Text, TextInput } from '@mantine/core'
import type { Data } from '@generated/data'
import ClassSkillPicker, { type ClassSkillOption } from '~/components/class_skill_picker'

type DuplicateLevel = {
  id: number
  name: string
  available?: boolean
  stages: Array<{
    id: number
    name: string
    skills: Array<{ id: number; name: string }>
  }>
}

function duplicateName(sourceName: string) {
  return sourceName.endsWith(' (copy)') ? sourceName : `${sourceName} (copy)`
}

export default function ClassDuplicateForm({
  sourceClass,
  levels,
  termOptions,
  skillOptions,
  redirectBack = false,
  onCancel,
  onSuccess,
}: {
  sourceClass: Data.SwimmingClass
  levels: DuplicateLevel[]
  termOptions: Data.SwimYear[]
  skillOptions: ClassSkillOption[]
  redirectBack?: boolean
  onCancel: () => void
  onSuccess?: () => void
}) {
  const targetLevels = levels.filter((candidate) => candidate.available !== false)
  const initialLevel =
    targetLevels.find((candidate) => candidate.id === sourceClass.levelId) ??
    targetLevels[0] ??
    null
  const initialStage =
    initialLevel?.stages.find((candidate) => candidate.id === sourceClass.levelStageId) ??
    initialLevel?.stages[0] ??
    null
  const terms = termOptions.flatMap((swimYear) =>
    swimYear.terms.map((term) => ({ ...term, swimYearName: swimYear.name }))
  )
  const todayIso = new Date().toISOString().slice(0, 10)
  const defaultTerm =
    (sourceClass.term ? terms.find((term) => term.id === sourceClass.term?.id) : undefined) ??
    terms.find((term) => term.startsOn.raw <= todayIso && todayIso <= term.endsOn.raw) ??
    terms.find((term) => term.startsOn.raw > todayIso) ??
    terms[0]

  const [levelId, setLevelId] = useState(initialLevel ? String(initialLevel.id) : '')
  const [stageId, setStageId] = useState(initialStage ? String(initialStage.id) : '')
  const [termId, setTermId] = useState(defaultTerm ? String(defaultTerm.id) : '')
  const [name, setName] = useState(duplicateName(sourceClass.name))
  const [durationMinutes, setDurationMinutes] = useState(String(sourceClass.durationMinutes ?? 45))
  const [skillIds, setSkillIds] = useState<string[]>(
    sourceClass.skills.map((skill) => String(skill.id))
  )

  const level = targetLevels.find((candidate) => String(candidate.id) === levelId)
  const stage = level?.stages.find((candidate) => String(candidate.id) === stageId)
  const selectedSkills = skillIds.flatMap((id) => {
    const skill = skillOptions.find((candidate) => String(candidate.id) === id)
    return skill ? [skill] : []
  })
  const changeLevel = (value: string) => {
    setLevelId(value)
    const nextLevel = targetLevels.find((candidate) => String(candidate.id) === value)
    setStageId(nextLevel?.stages[0] ? String(nextLevel.stages[0].id) : '')
  }

  if (targetLevels.length === 0 || terms.length === 0) {
    return (
      <Card withBorder shadow="none">
        <Group justify="space-between">
          <Text size="sm">
            {targetLevels.length === 0
              ? 'No available levels can receive this duplicate.'
              : 'Classes belong to a term — create a swim year with terms in Settings first.'}
          </Text>
          <Button type="button" variant="default" size="xs" onClick={onCancel}>
            Cancel
          </Button>
        </Group>
      </Card>
    )
  }

  return (
    <Card withBorder shadow="none">
      <Form route="swimming_classes.store" onSuccess={onSuccess ?? onCancel}>
        {({ errors, processing }) => (
          <Stack gap="md">
            <div>
              <Text fw={800} fz="lg">
                Duplicate class
              </Text>
              <Text size="sm" c="dimmed">
                Choose where the copy belongs, then adjust the class before saving.
              </Text>
            </div>

            <input type="hidden" name="levelId" value={levelId} />
            <input type="hidden" name="levelStageId" value={stageId} />
            <input type="hidden" name="termId" value={termId} />
            <input type="hidden" name="durationMinutes" value={durationMinutes} />
            {redirectBack && <input type="hidden" name="redirectTo" value="back" />}
            {name.trim() !== '' && <input type="hidden" name="name" value={name} />}
            {skillIds.map((id, index) => (
              <input key={id} type="hidden" name={`skillIds[${index}]`} value={id} />
            ))}

            <Group gap="sm" align="flex-start" grow>
              <TextInput
                label="Class name"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                error={errors.name}
              />
              <NativeSelect
                label="Target level"
                value={levelId}
                onChange={(event) => changeLevel(event.currentTarget.value)}
                data={targetLevels.map((candidate) => ({
                  value: String(candidate.id),
                  label: candidate.name,
                }))}
                error={errors.levelId}
              />
              <NativeSelect
                label="Target stage"
                value={stageId}
                onChange={(event) => setStageId(event.currentTarget.value)}
                data={(level?.stages ?? []).map((candidate) => ({
                  value: String(candidate.id),
                  label: candidate.name,
                }))}
                error={errors.levelStageId}
              />
            </Group>

            <Group gap="sm" align="flex-start" grow>
              <NativeSelect
                label="Term"
                value={termId}
                onChange={(event) => setTermId(event.currentTarget.value)}
                data={terms.map((term) => ({
                  value: String(term.id),
                  label: `${term.swimYearName} · ${term.name} (${term.startsOn.formatted} – ${term.endsOn.formatted})`,
                }))}
                error={errors.termId}
              />
              <TextInput
                label="Lesson duration"
                type="number"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.currentTarget.value)}
                rightSection={
                  <Text size="sm" c="dimmed">
                    mins
                  </Text>
                }
                rightSectionWidth={52}
                error={errors.durationMinutes}
              />
            </Group>

            <div>
              <Text fw={700}>Skills in this class</Text>
              <Text size="sm" c="dimmed">
                {selectedSkills.length} {selectedSkills.length === 1 ? 'skill' : 'skills'}
                {stage ? ` · ${stage.name}` : ''}
              </Text>
              <ClassSkillPicker
                skillOptions={skillOptions}
                value={skillIds}
                onChange={setSkillIds}
              />
            </div>

            <Divider />
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                {level?.name ?? 'No level'} · {stage?.name ?? 'No stage'} · {durationMinutes || 0}
                -minute class
              </Text>
              <Group gap="sm">
                <Button type="button" variant="default" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit" loading={processing}>
                  Save
                </Button>
              </Group>
            </Group>
          </Stack>
        )}
      </Form>
    </Card>
  )
}
