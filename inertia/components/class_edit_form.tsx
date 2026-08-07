import { useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import { Button, Card, Group, NativeSelect, Stack, Text, TextInput } from '@mantine/core'
import type { Data } from '@generated/data'
import ClassSkillPicker, { type ClassSkillOption } from '~/components/class_skill_picker'
import InstructorPicker, { invitationKey, membershipKey } from '~/components/instructor_picker'

const CLASS_INSTRUCTOR_ROLE_LEAD = 1
const CLASS_INSTRUCTOR_ROLE_SUPPORTING = 2

export default function ClassEditForm({
  swimmingClass,
  level,
  instructorOptions,
  pendingInstructorOptions,
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

  const instructorKey = (instructor: Data.SwimmingClass['instructors'][number]) =>
    instructor.type === 'membership' ? membershipKey(instructor.id) : invitationKey(instructor.id)
  const leadInstructor =
    swimmingClass.leadInstructor ??
    swimmingClass.instructors.find((instructor) => instructor.role === CLASS_INSTRUCTOR_ROLE_LEAD)
  const savedSupportingInstructors = swimmingClass.supportingInstructors ?? []
  const supportingInstructors =
    savedSupportingInstructors.length > 0
      ? savedSupportingInstructors
      : swimmingClass.instructors.filter(
          (instructor) => instructor.role === CLASS_INSTRUCTOR_ROLE_SUPPORTING
        )

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
              <TextInput
                label="Class name"
                name="name"
                defaultValue={swimmingClass.name}
                error={errors.name}
              />
              <TextInput
                label="Duration (mins)"
                name="durationMinutes"
                type="number"
                w={160}
                defaultValue={String(swimmingClass.durationMinutes)}
                error={errors.durationMinutes}
              />
              {termId !== '' && <input type="hidden" name="termId" value={termId} />}
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

            <InstructorPicker
              instructorOptions={instructorOptions}
              pendingInstructorOptions={pendingInstructorOptions}
              initialLead={leadInstructor ? instructorKey(leadInstructor) : null}
              initialSupporting={supportingInstructors.map(instructorKey)}
              errors={errors}
            />

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
