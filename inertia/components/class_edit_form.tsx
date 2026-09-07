import { useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import { Button, Card, Group, NativeSelect, Stack, Text, TextInput } from '@mantine/core'
import type { Data } from '@generated/data'
import AssessmentGoalsFields from '~/components/assessment_goals_fields'
import ClassSkillPicker, { type ClassSkillOption } from '~/components/class_skill_picker'

export default function ClassEditForm({
  swimmingClass,
  level,
  skillOptions,
  termOptions,
  redirectBack = false,
  lockStage = false,
  onCancel,
  onSuccess,
}: {
  swimmingClass: Data.SwimmingClass
  level: Data.Level
  instructorOptions: Data.Membership[]
  pendingInstructorOptions: Data.Invitation[]
  skillOptions: ClassSkillOption[]
  termOptions: Data.SwimYear[]
  redirectBack?: boolean
  lockStage?: boolean
  onCancel?: () => void
  onSuccess?: () => void
}) {
  const stages = level.stages ?? []
  const initialStage = stages.find((candidate) => candidate.id === swimmingClass.levelStageId)
  const defaultSkillIdsForStage = (candidate: Data.Level['stages'][number] | undefined) => {
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
  const initialSkillIds =
    swimmingClass.skills.length > 0
      ? swimmingClass.skills.map((skill) => String(skill.id))
      : defaultSkillIdsForStage(initialStage)

  const [levelStageId, setLevelStageId] = useState(String(swimmingClass.levelStageId))
  const [termId, setTermId] = useState(swimmingClass.term ? String(swimmingClass.term.id) : '')
  const [aim, setAim] = useState(swimmingClass.aim ?? '')
  const [assessmentGoals, setAssessmentGoals] = useState(
    swimmingClass.assessmentGoals.length > 0 ? swimmingClass.assessmentGoals : ['']
  )
  const [prerequisiteStageId, setPrerequisiteStageId] = useState(
    swimmingClass.prerequisiteStageId ? String(swimmingClass.prerequisiteStageId) : 'none'
  )
  const [maxLessons, setMaxLessons] = useState(
    swimmingClass.maxLessons ? String(swimmingClass.maxLessons) : '0'
  )
  const [skillIds, setSkillIds] = useState<string[]>(initialSkillIds)
  const stage = stages.find((candidate) => String(candidate.id) === levelStageId)

  const termChoices = [
    // Untied legacy classes may stay untied; once tied, a term is required.
    ...(swimmingClass.term ? [] : [{ value: '', label: 'No term' }]),
    ...termOptions.flatMap((swimYear) =>
      swimYear.terms.map((term) => ({
        value: String(term.id),
        label: `${swimYear.name} · ${term.name} (${term.startsOn.formatted} - ${term.endsOn.formatted})`,
      }))
    ),
  ]

  return (
    <Form
      route="swimming_classes.update"
      routeParams={{ id: swimmingClass.id }}
      onSuccess={onSuccess}
    >
      {({ errors, processing }) => (
        <Card withBorder shadow="none">
          <Stack gap="lg">
            <Stack gap="sm">
              <Group gap="md" align="flex-start" wrap="wrap">
                <TextInput
                  label="Class name"
                  name="name"
                  defaultValue={swimmingClass.name}
                  error={errors.name}
                  style={{ flex: '1 1 360px' }}
                />
                <TextInput
                  label="Duration (mins)"
                  name="durationMinutes"
                  type="number"
                  w={180}
                  defaultValue={String(swimmingClass.durationMinutes)}
                  error={errors.durationMinutes}
                />
                <TextInput
                  label="Max lessons"
                  name="maxLessons"
                  type="number"
                  w={180}
                  value={maxLessons}
                  onChange={(event) => setMaxLessons(event.currentTarget.value)}
                  error={errors.maxLessons}
                  required
                />
              </Group>
              {termId !== '' && <input type="hidden" name="termId" value={termId} />}
              <TextInput
                label="Main objective"
                description="What a learner should be able to do by the end of the class."
                placeholder="e.g. Swim 10 m unaided and recover to the wall with confidence"
                name="aim"
                value={aim}
                onChange={(event) => setAim(event.currentTarget.value)}
                error={errors.aim}
                required
              />
              {assessmentGoals.map((goal, index) => (
                <input key={index} type="hidden" name={`assessmentGoals[${index}]`} value={goal} />
              ))}
              <AssessmentGoalsFields
                goals={assessmentGoals}
                onChange={setAssessmentGoals}
                error={errors.assessmentGoals}
              />
              <NativeSelect
                label="Pre-requisite"
                description="The stage a learner must have cleared before joining this class."
                value={prerequisiteStageId}
                onChange={(event) => setPrerequisiteStageId(event.currentTarget.value)}
                data={[
                  { value: 'none', label: 'No prerequisite' },
                  ...stages
                    .filter((candidate) => String(candidate.id) !== levelStageId)
                    .map((candidate) => ({
                      value: String(candidate.id),
                      label: `${level.name} - ${candidate.name}`,
                    })),
                ]}
                error={errors.prerequisiteStageId}
                required
              />
              {prerequisiteStageId !== 'none' && (
                <input type="hidden" name="prerequisiteStageId" value={prerequisiteStageId} />
              )}
              {redirectBack && <input type="hidden" name="redirectTo" value="back" />}
              <NativeSelect
                label="Term"
                value={termId}
                onChange={(event) => setTermId(event.currentTarget.value)}
                error={errors.termId}
                data={termChoices}
              />
            </Stack>

            <Stack gap="sm">
              <Text fw={700}>Curriculum</Text>
              <Text size="xs" c="dimmed">
                Activities are planned per lesson from the class page.
              </Text>
              <input type="hidden" name="levelStageId" value={levelStageId} />
              {lockStage ? (
                <div>
                  <Text size="sm" fw={700}>
                    Stage
                  </Text>
                  <Text size="sm" c="dimmed">
                    {stage?.name ?? 'Current stage'}
                  </Text>
                </div>
              ) : (
                <NativeSelect
                  label="Select stage"
                  value={levelStageId}
                  onChange={(event) => {
                    const nextStageId = event.currentTarget.value
                    const nextStage = stages.find(
                      (candidate) => String(candidate.id) === nextStageId
                    )
                    setLevelStageId(nextStageId)
                    setSkillIds(defaultSkillIdsForStage(nextStage))
                  }}
                  data={stages.map((candidate) => ({
                    value: String(candidate.id),
                    label: candidate.name,
                  }))}
                />
              )}
              <div>
                <Text size="sm" fw={700}>
                  Select skills
                </Text>
                <ClassSkillPicker
                  skillOptions={skillOptions}
                  value={skillIds}
                  onChange={setSkillIds}
                />
              </div>
              {skillIds.map((id, index) => (
                <input key={id} type="hidden" name={`skillIds[${index}]`} value={id} />
              ))}
            </Stack>

            <Group justify="flex-end" gap="sm">
              {onCancel && (
                <Button type="button" variant="default" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" loading={processing}>
                Save changes
              </Button>
            </Group>
          </Stack>
        </Card>
      )}
    </Form>
  )
}
