import { Fragment, useMemo, useState } from 'react'
import { useDisclosure } from '@mantine/hooks'
import {
  Anchor,
  Button,
  Card,
  Checkbox,
  Divider,
  Group,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import type { Data } from '@generated/data'
import ClassStageModal, { type ClassStageDraft } from '~/components/class_stage_modal'
import InstructorPicker, { type InstructorMode } from '~/components/instructor_picker'

const WEEKDAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
]

export type ClassFormInitialValues = {
  code?: string
  name?: string
  levelId?: number
  startDate?: string
  endDate?: string
  weekdays?: number[]
  startTime?: string
  endTime?: string
  capacity?: number
  location?: string
  instructorMode?: InstructorMode
  instructorMembershipId?: number
  inviteTeacherName?: string
  inviteTeacherPhone?: string
  inviteTeacherEmail?: string
  stages?: ClassStageDraft[]
}

type Props = {
  errors: Record<string, string>
  processing: boolean
  submitLabel: string
  levelOptions: Data.Level.Variants['forClassOption'][]
  instructorOptions: Data.Membership[]
  skillOptions: Data.Skill[]
  preselectedLevelId?: number
  initial?: ClassFormInitialValues
}

export default function ClassFormBody({
  errors,
  processing,
  submitLabel,
  levelOptions,
  instructorOptions,
  skillOptions,
  preselectedLevelId,
  initial,
}: Props) {
  const [weekdays, setWeekdays] = useState<number[]>(initial?.weekdays ?? [])
  const [stages, setStages] = useState<ClassStageDraft[]>(initial?.stages ?? [])
  const [instructorMode, setInstructorMode] = useState<InstructorMode>(
    initial?.instructorMode ?? 'existing'
  )
  const [opened, { open, close }] = useDisclosure(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const skillNames = useMemo(
    () => new Map(skillOptions.map((skill) => [skill.id, skill.name])),
    [skillOptions]
  )

  const selectedLevelId = initial?.levelId ?? preselectedLevelId

  const toggleWeekday = (weekday: number) => {
    setWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((value) => value !== weekday)
        : [...current, weekday]
    )
  }

  const openAdd = () => {
    setEditingIndex(null)
    open()
  }

  const openEdit = (index: number) => {
    setEditingIndex(index)
    open()
  }

  const removeStage = (index: number) => {
    setStages((current) => current.filter((_, i) => i !== index))
  }

  const saveStage = (stage: ClassStageDraft) => {
    setStages((current) => {
      const next =
        editingIndex === null
          ? [...current, stage]
          : current.map((existing, index) => (index === editingIndex ? stage : existing))

      return next.toSorted((a, b) => a.position - b.position)
    })
  }

  return (
    <>
      <Stack gap="lg">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="Class code"
            name="code"
            defaultValue={initial?.code}
            description="Optional. Leave blank to generate one."
            error={errors.code}
          />
          <TextInput
            label="Class name"
            name="name"
            defaultValue={initial?.name}
            error={errors.name}
          />
        </SimpleGrid>

        <NativeSelect
          label="Program level"
          name="levelId"
          defaultValue={selectedLevelId ? String(selectedLevelId) : ''}
          data={[
            { value: '', label: 'Choose a level' },
            ...levelOptions.map((level) => ({
              value: String(level.id),
              label: `${level.programName} — ${level.name} (${level.capacity} max)`,
            })),
          ]}
          error={errors.levelId}
        />

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="Start date"
            name="startDate"
            type="date"
            defaultValue={initial?.startDate}
            error={errors.startDate}
          />
          <TextInput
            label="End date"
            name="endDate"
            type="date"
            defaultValue={initial?.endDate}
            error={errors.endDate}
          />
        </SimpleGrid>

        <Stack gap="xs">
          <Text fw={500}>Meeting days</Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {WEEKDAYS.map((weekday) => (
              <Checkbox
                key={weekday.value}
                label={weekday.label}
                checked={weekdays.includes(weekday.value)}
                onChange={() => toggleWeekday(weekday.value)}
              />
            ))}
          </SimpleGrid>
          {errors.weekdays && (
            <Text c="red" size="sm">
              {errors.weekdays}
            </Text>
          )}
          {weekdays.map((weekday) => (
            <input key={weekday} type="hidden" name="weekdays[]" value={weekday} />
          ))}
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="Start time"
            name="startTime"
            type="time"
            defaultValue={initial?.startTime}
            error={errors.startTime}
          />
          <TextInput
            label="End time"
            name="endTime"
            type="time"
            defaultValue={initial?.endTime}
            error={errors.endTime}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="Capacity"
            name="capacity"
            type="number"
            min={1}
            defaultValue={initial?.capacity}
            error={errors.capacity}
          />
          <TextInput
            label="Location"
            name="location"
            defaultValue={initial?.location}
            error={errors.location}
          />
        </SimpleGrid>

        <Divider />

        <InstructorPicker
          mode={instructorMode}
          onModeChange={setInstructorMode}
          instructorOptions={instructorOptions}
          errors={errors}
          initialMembershipId={initial?.instructorMembershipId}
          initialInvite={{
            name: initial?.inviteTeacherName,
            phone: initial?.inviteTeacherPhone,
            email: initial?.inviteTeacherEmail,
          }}
        />

        <Divider />

        <Group justify="space-between">
          <Title order={3}>Stages and skills</Title>
          <Button type="button" variant="light" size="sm" onClick={openAdd}>
            Add stage
          </Button>
        </Group>

        {stages.length === 0 ? (
          <Text c="dimmed" size="sm">
            No stages added yet. Add at least one stage with at least one skill.
          </Text>
        ) : (
          stages.map((stage, index) => (
            <Card
              key={`${stage.position}-${stage.name}-${index}`}
              withBorder
              padding="sm"
              radius="md"
            >
              <Group justify="space-between" align="flex-start">
                <Stack gap={4}>
                  <Text fw={500}>
                    {stage.position}. {stage.name}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {[
                      ...stage.skillIds.map((skillId) => skillNames.get(skillId)).filter(Boolean),
                      ...stage.newSkills.map((skill) => skill.name),
                    ].join(', ')}
                  </Text>
                </Stack>
                <Group gap="md">
                  <Anchor
                    component="button"
                    type="button"
                    size="sm"
                    onClick={() => openEdit(index)}
                  >
                    Edit
                  </Anchor>
                  <Anchor
                    component="button"
                    type="button"
                    size="sm"
                    c="red"
                    onClick={() => removeStage(index)}
                  >
                    Remove
                  </Anchor>
                </Group>
              </Group>
            </Card>
          ))
        )}

        {errors.stages && (
          <Text c="red" size="sm">
            {errors.stages}
          </Text>
        )}

        {stages.map((stage, stageIndex) => (
          <Fragment key={`${stage.position}-${stage.name}-${stageIndex}-inputs`}>
            {stage.id !== undefined && (
              <input type="hidden" name={`stages[${stageIndex}][id]`} value={stage.id} />
            )}
            <input type="hidden" name={`stages[${stageIndex}][name]`} value={stage.name} />
            <input type="hidden" name={`stages[${stageIndex}][position]`} value={stage.position} />
            {stage.skillIds.map((skillId) => (
              <input
                key={skillId}
                type="hidden"
                name={`stages[${stageIndex}][skillIds][]`}
                value={skillId}
              />
            ))}
            {stage.newSkills.map((skill, skillIndex) => (
              <Fragment key={`${skill.name}-${skillIndex}`}>
                <input
                  type="hidden"
                  name={`stages[${stageIndex}][newSkills][${skillIndex}][name]`}
                  value={skill.name}
                />
                <input
                  type="hidden"
                  name={`stages[${stageIndex}][newSkills][${skillIndex}][description]`}
                  value={skill.description}
                />
              </Fragment>
            ))}
          </Fragment>
        ))}

        <Group justify="flex-end">
          <Button type="submit" size="md" loading={processing} disabled={stages.length === 0}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>

      <ClassStageModal
        opened={opened}
        onClose={close}
        onSave={saveStage}
        skillOptions={skillOptions}
        initial={editingIndex !== null ? stages[editingIndex] : undefined}
        nextPosition={stages.length + 1}
      />
    </>
  )
}
