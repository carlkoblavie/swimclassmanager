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
import InstructorPicker, { type InstructorMode } from '~/components/instructor_picker'

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
}>

export default function ClassEdit({ swimmingClass, level, instructorOptions }: PageProps) {
  const stages = level.stages ?? []

  const [levelStageId, setLevelStageId] = useState(String(swimmingClass.levelStageId))
  const [skillIds, setSkillIds] = useState<string[]>(
    swimmingClass.skills.map((skill) => String(skill.id))
  )
  const [activityIds, setActivityIds] = useState<string[]>(
    swimmingClass.activities.map((activity) => String(activity.id))
  )
  const [instructorMode, setInstructorMode] = useState<InstructorMode>(
    swimmingClass.pendingInstructorInvitationId
      ? 'invite'
      : swimmingClass.instructorMembershipId
        ? 'existing'
        : 'none'
  )

  const stage = stages.find((candidate) => String(candidate.id) === levelStageId)
  const stageSkills = stage?.skills ?? []
  const selectedSkills = stageSkills.filter((skill) => skillIds.includes(String(skill.id)))

  const changeStage = (value: string) => {
    setLevelStageId(value)
    setSkillIds([])
    setActivityIds([])
  }

  return (
    <Container size="md" py="xl">
      <Form route="swimming_classes.update" routeParams={{ id: swimmingClass.id }}>
        {({ errors, processing }) => (
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={1}>Edit class</Title>
                <Text c="dimmed" size="sm">
                  {swimmingClass.code} · {level.name} · schedule, curriculum, location, and
                  instructor.
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
              </Stack>
            </Card>

            <Card>
              <Stack gap="sm">
                <Text fw={700}>Curriculum</Text>
                <input type="hidden" name="levelStageId" value={levelStageId} />
                <NativeSelect
                  label="Select stage"
                  value={levelStageId}
                  onChange={(event) => changeStage(event.currentTarget.value)}
                  data={stages.map((candidate) => ({
                    value: String(candidate.id),
                    label: candidate.name,
                  }))}
                />
                <MultiSelect
                  label="Select skills"
                  value={skillIds}
                  onChange={(next) => {
                    const allowed = new Set(
                      stageSkills
                        .filter((skill) => next.includes(String(skill.id)))
                        .flatMap((skill) => skill.activities.map((a) => String(a.id)))
                    )
                    setSkillIds(next)
                    setActivityIds((current) => current.filter((id) => allowed.has(id)))
                  }}
                  data={stageSkills.map((skill) => ({
                    value: String(skill.id),
                    label: skill.name,
                  }))}
                />
                {selectedSkills.map((skill) => (
                  <MultiSelect
                    key={skill.id}
                    label={`${skill.name} activities`}
                    value={activityIds.filter((id) =>
                      skill.activities.some((a) => String(a.id) === id)
                    )}
                    onChange={(selected) => {
                      const others = activityIds.filter(
                        (id) => !skill.activities.some((a) => String(a.id) === id)
                      )
                      setActivityIds([...others, ...selected])
                    }}
                    data={skill.activities.map((activity) => ({
                      value: String(activity.id),
                      label: activity.name,
                    }))}
                  />
                ))}
                {skillIds.map((id, index) => (
                  <input key={id} type="hidden" name={`skillIds[${index}]`} value={id} />
                ))}
                {activityIds.map((id, index) => (
                  <input key={id} type="hidden" name={`activityIds[${index}]`} value={id} />
                ))}
              </Stack>
            </Card>

            <Card>
              <InstructorPicker
                mode={instructorMode}
                onModeChange={setInstructorMode}
                instructorOptions={instructorOptions}
                errors={errors}
                initialMembershipId={swimmingClass.instructorMembershipId ?? undefined}
              />
            </Card>
          </Stack>
        )}
      </Form>
    </Container>
  )
}
