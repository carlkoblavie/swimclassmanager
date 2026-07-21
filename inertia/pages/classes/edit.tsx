import { useState } from 'react'
import {
  Button,
  Card,
  Container,
  Group,
  MultiSelect,
  NativeSelect,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { Form, Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import { urlFor } from '~/client'
import InstructorPicker, { invitationKey, membershipKey } from '~/components/instructor_picker'

const WEEKDAYS = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '7', label: 'Sunday' },
]

type PageProps = InertiaProps<{
  swimmingClass: Data.SwimmingClass
  level: Data.Level
  instructorOptions: Data.Membership[]
  pendingInstructorOptions: Data.Invitation[]
  termOptions: Data.SwimYear[]
}>

export default function ClassEdit({
  swimmingClass,
  level,
  instructorOptions,
  pendingInstructorOptions,
  termOptions,
}: PageProps) {
  const stages = level.stages ?? []
  const [levelStageId, setLevelStageId] = useState(String(swimmingClass.levelStageId))

  const [termId, setTermId] = useState(swimmingClass.term ? String(swimmingClass.term.id) : '')
  const termChoices = [
    // Untied legacy classes may stay untied; once tied, a term is required.
    ...(swimmingClass.term ? [] : [{ value: '', label: 'No term' }]),
    ...termOptions.flatMap((swimYear) =>
      swimYear.terms.map((term) => ({
        value: String(term.id),
        label: `${swimYear.name} · ${term.name} (${term.startsOn.formatted} – ${term.endsOn.formatted})`,
      }))
    ),
  ]
  const [skillIds, setSkillIds] = useState<string[]>(
    swimmingClass.skills.map((skill) => String(skill.id))
  )
  const stage = stages.find((candidate) => String(candidate.id) === levelStageId)
  const stageSkills = stage?.skills ?? []

  const initialInstructors = swimmingClass.instructors.map((instructor) =>
    instructor.type === 'membership' ? membershipKey(instructor.id) : invitationKey(instructor.id)
  )

  return (
    <Container size="md" py="xl">
      <Form route="swimming_classes.update" routeParams={{ id: swimmingClass.id }}>
        {({ errors, processing }) => (
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={1}>Edit class</Title>
                <Text c="dimmed" size="sm">
                  {swimmingClass.code} · {swimmingClass.level?.name} · lessons are planned from the
                  class page.
                </Text>
              </div>
              <Group gap="sm">
                <Button
                  component={Link}
                  href={urlFor('swimming_classes.show', { id: swimmingClass.id })}
                  variant="subtle"
                >
                  Back
                </Button>
                <Button type="submit" loading={processing}>
                  Save changes
                </Button>
              </Group>
            </Group>

            <Card>
              <Stack gap="sm">
                <TextInput
                  label="Class name"
                  name="name"
                  defaultValue={swimmingClass.name}
                  error={errors.name}
                />
                <Group gap="sm" align="flex-start">
                  <NativeSelect
                    label="Day"
                    name="weekday"
                    flex={1}
                    defaultValue={String(swimmingClass.weekday)}
                    data={WEEKDAYS}
                  />
                  <TextInput
                    label="Start time"
                    name="startTime"
                    type="time"
                    w={130}
                    defaultValue={swimmingClass.startTime.raw}
                    error={errors.startTime}
                  />
                  <TextInput
                    label="Duration (mins)"
                    name="durationMinutes"
                    type="number"
                    w={130}
                    defaultValue={String(swimmingClass.durationMinutes)}
                    error={errors.durationMinutes}
                  />
                </Group>
                <TextInput
                  label="Location"
                  name="location"
                  defaultValue={swimmingClass.location ?? ''}
                  error={errors.location}
                />
                {termId !== '' && <input type="hidden" name="termId" value={termId} />}
                <NativeSelect
                  label="Term"
                  value={termId}
                  onChange={(event) => setTermId(event.currentTarget.value)}
                  error={errors.termId}
                  data={termChoices}
                />
              </Stack>
            </Card>

            <Card>
              <Stack gap="sm">
                <Text fw={700}>Curriculum</Text>
                <Text size="xs" c="dimmed">
                  Activities are planned per lesson from the class page.
                </Text>
                <input type="hidden" name="levelStageId" value={levelStageId} />
                <NativeSelect
                  label="Select stage"
                  value={levelStageId}
                  onChange={(event) => {
                    setLevelStageId(event.currentTarget.value)
                    setSkillIds([])
                  }}
                  data={stages.map((candidate) => ({
                    value: String(candidate.id),
                    label: candidate.name,
                  }))}
                />
                <MultiSelect
                  label="Select skills"
                  value={skillIds}
                  onChange={setSkillIds}
                  data={stageSkills.map((skill) => ({
                    value: String(skill.id),
                    label: skill.name,
                  }))}
                />
                {skillIds.map((id, index) => (
                  <input key={id} type="hidden" name={`skillIds[${index}]`} value={id} />
                ))}
              </Stack>
            </Card>

            <Card>
              <InstructorPicker
                instructorOptions={instructorOptions}
                pendingInstructorOptions={pendingInstructorOptions}
                initialSelection={initialInstructors}
                errors={errors}
              />
            </Card>
          </Stack>
        )}
      </Form>
    </Container>
  )
}
