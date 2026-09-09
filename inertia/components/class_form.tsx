import { useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import {
  Box,
  Button,
  Card,
  Divider,
  Group,
  NativeSelect,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import type { Data } from '@generated/data'
import AssessmentGoalsFields from '~/components/assessment_goals_fields'
import ClassSkillPicker, { type ClassSkillOption } from '~/components/class_skill_picker'

export type { ClassSkillOption } from '~/components/class_skill_picker'

type FormLevel = {
  id: number
  name: string
  stages: Array<{
    id: number
    name: string
    skills: Array<{ id: number; name: string }>
  }>
}

// Create a single class: skills, stage, term, and a lesson duration. No day or
// start time — scheduling happens later.
export default function ClassForm({
  level,
  termOptions,
  skillOptions,
  initialStageId,
  redirectBack = false,
  lockStage = false,
  onClose,
}: {
  level: FormLevel
  termOptions: Data.SwimYear[]
  skillOptions: ClassSkillOption[]
  initialStageId?: number
  redirectBack?: boolean
  lockStage?: boolean
  onClose: () => void
}) {
  const stages = level.stages ?? []

  const terms = termOptions.flatMap((swimYear) =>
    swimYear.terms.map((term) => ({ ...term, swimYearName: swimYear.name }))
  )
  const todayIso = new Date().toISOString().slice(0, 10)
  const defaultTerm =
    terms.find((term) => term.startsOn.raw <= todayIso && todayIso <= term.endsOn.raw) ??
    terms.find((term) => term.startsOn.raw > todayIso) ??
    terms[0]
  const initialStage =
    stages.find((candidate) => candidate.id === initialStageId) ?? stages[0] ?? null

  const [termId, setTermId] = useState(defaultTerm ? String(defaultTerm.id) : '')
  const [stageId, setStageId] = useState(initialStage ? String(initialStage.id) : '')
  const [name, setName] = useState('')
  const [aim, setAim] = useState('')
  const [assessmentGoals, setAssessmentGoals] = useState([''])
  const [prerequisiteStageId, setPrerequisiteStageId] = useState('none')
  const [durationMinutes, setDurationMinutes] = useState('45')
  const [maxLessons, setMaxLessons] = useState('5')
  const defaultSkillIdsForStage = (candidate: FormLevel['stages'][number] | undefined) => {
    if (!candidate) {
      return []
    }

    const stageSkillNames = new Set(
      candidate.skills.map((skill) => skill.name.trim().toLowerCase())
    )
    const stageSkillSourceKeys = new Set(
      candidate.skills.map((skill) => `level_stage_skill:${skill.id}`)
    )

    return skillOptions
      .filter(
        (skill) =>
          (skill.sourceKey && stageSkillSourceKeys.has(skill.sourceKey)) ||
          stageSkillNames.has(skill.name.trim().toLowerCase())
      )
      .map((skill) => String(skill.id))
  }
  const [skillIds, setSkillIds] = useState<string[]>(
    defaultSkillIdsForStage(initialStage ?? undefined)
  )

  const stage = stages.find((candidate) => String(candidate.id) === stageId)
  const generatedName = stage ? `${level.name} · ${stage.name}` : level.name

  const selectedSkills = skillIds.flatMap((id) => {
    const skill = skillOptions.find((candidate) => String(candidate.id) === id)
    return skill ? [skill] : []
  })
  const changeStage = (value: string) => {
    setStageId(value)
    const nextStage = stages.find((candidate) => String(candidate.id) === value)
    setSkillIds(defaultSkillIdsForStage(nextStage))
  }

  if (stages.length === 0 || terms.length === 0) {
    return (
      <Card withBorder shadow="none">
        <Group justify="space-between">
          <Text size="sm">
            {stages.length === 0
              ? 'This level has no stages yet — add curriculum to the program first.'
              : 'Classes belong to a term — create a swim year with terms in Settings first.'}
          </Text>
          <Button type="button" variant="default" size="xs" onClick={onClose}>
            Close
          </Button>
        </Group>
      </Card>
    )
  }

  return (
    <Card withBorder shadow="none">
      <Form route="swimming_classes.store" onSuccess={onClose}>
        {({ errors, processing }) => (
          <Stack gap="md">
            <div>
              <Text fw={800} fz="lg">
                New class
              </Text>
              <Text size="sm" c="dimmed">
                Skills, stage, and duration — nothing else.
              </Text>
            </div>

            <input type="hidden" name="levelId" value={level.id} />
            <input type="hidden" name="termId" value={termId} />
            <input type="hidden" name="levelStageId" value={stageId} />
            <input type="hidden" name="durationMinutes" value={durationMinutes} />
            {redirectBack && <input type="hidden" name="redirectTo" value="back" />}
            {name.trim() !== '' && <input type="hidden" name="name" value={name} />}
            <input type="hidden" name="aim" value={aim} />
            {assessmentGoals.map((goal, index) => (
              <input key={index} type="hidden" name={`assessmentGoals[${index}]`} value={goal} />
            ))}
            {prerequisiteStageId !== 'none' && (
              <input type="hidden" name="prerequisiteStageId" value={prerequisiteStageId} />
            )}
            <input type="hidden" name="maxLessons" value={maxLessons} />
            {skillIds.map((id, index) => (
              <input key={id} type="hidden" name={`skillIds[${index}]`} value={id} />
            ))}

            {lockStage ? (
              <Box>
                <Text size="sm" fw={700}>
                  Stage
                </Text>
                <Text size="sm" c="dimmed" mt={6}>
                  {stage?.name ?? 'Current stage'}
                </Text>
              </Box>
            ) : (
              <NativeSelect
                label="Stage"
                description="The level this class teaches at."
                value={stageId}
                onChange={(event) => changeStage(event.currentTarget.value)}
                data={stages.map((candidate) => ({
                  value: String(candidate.id),
                  label: candidate.name,
                }))}
                error={errors.levelStageId}
                w={260}
              />
            )}

            <Group gap="md" align="flex-start" wrap="wrap">
              <TextInput
                label="Class name"
                placeholder={generatedName}
                description="Leave blank to use the generated name."
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                error={errors.name}
                style={{ flex: '1 1 360px' }}
              />
              <TextInput
                label="Lesson duration"
                description="Days and times are set later."
                type="number"
                w={180}
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
              <TextInput
                label="Max lessons"
                type="number"
                w={180}
                value={maxLessons}
                onChange={(event) => setMaxLessons(event.currentTarget.value)}
                error={errors.maxLessons}
                required
              />
              <NativeSelect
                label="Term"
                description="The term this class belongs to."
                value={termId}
                onChange={(event) => setTermId(event.currentTarget.value)}
                data={terms.map((term) => ({
                  value: String(term.id),
                  label: `${term.swimYearName} · ${term.name} (${term.startsOn.formatted} – ${term.endsOn.formatted})`,
                }))}
                error={errors.termId}
                style={{ flex: '0 1 420px' }}
              />
            </Group>

            <TextInput
              label="Main objective"
              description="What a learner should be able to do by the end of the class."
              placeholder="e.g. Swim 10 m unaided and recover to the wall with confidence"
              value={aim}
              onChange={(event) => setAim(event.currentTarget.value)}
              error={errors.aim}
              required
            />

            <NativeSelect
              label="Pre-requisite"
              description="The stage a learner must have cleared before joining this class."
              value={prerequisiteStageId}
              onChange={(event) => setPrerequisiteStageId(event.currentTarget.value)}
              data={[
                { value: 'none', label: 'No prerequisite' },
                ...stages
                  .filter((candidate) => String(candidate.id) !== stageId)
                  .map((candidate) => ({
                    value: String(candidate.id),
                    label: `${level.name} - ${candidate.name}`,
                  })),
              ]}
              error={errors.prerequisiteStageId}
              required
            />

            <AssessmentGoalsFields
              goals={assessmentGoals}
              onChange={setAssessmentGoals}
              error={errors.assessmentGoals}
            />

            <Box>
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
            </Box>

            <Divider />
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                {selectedSkills.length} {selectedSkills.length === 1 ? 'skill' : 'skills'} ·{' '}
                {stage?.name ?? 'No stage'} · {durationMinutes || 0}-minute class
              </Text>
              <Group gap="sm">
                <Button type="button" variant="default" onClick={onClose}>
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
