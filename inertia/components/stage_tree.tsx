import { useState } from 'react'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Popover,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Tooltip,
} from '@mantine/core'
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import type { StageActivityDraft, StageDraft, StageSkillDraft } from '~/components/stage_builder'

const upperLabel = { tt: 'uppercase', fz: 'xs', c: 'dimmed', fw: 600 } as const

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

// Popover form for adding or editing a skill on a stage. When `initial` is
// provided the fields pre-fill and its id/activities are preserved on submit.
function SkillPopover({
  existingNames,
  initial,
  submitLabel = 'Add',
  onSubmit,
  trigger,
}: {
  existingNames: string[]
  initial?: StageSkillDraft
  submitLabel?: string
  onSubmit: (skill: StageSkillDraft) => void
  trigger: (open: () => void) => React.ReactNode
}) {
  const [opened, setOpened] = useState(false)
  const blank = () => ({
    name: initial?.name ?? '',
    passCriteria: initial?.passCriteria ?? '',
    description: initial?.description ?? '',
  })
  const [entry, setEntry] = useState(blank)
  const [errors, setErrors] = useState<{ name?: string; passCriteria?: string }>({})

  // Reset to the current initial each time the popover opens.
  const toggle = () => {
    setEntry(blank())
    setErrors({})
    setOpened((value) => !value)
  }

  const submit = () => {
    const next: typeof errors = {}
    if (!entry.name.trim()) {
      next.name = 'This field is required'
    } else if (
      existingNames.some((name) => name.trim().toLowerCase() === entry.name.trim().toLowerCase())
    ) {
      next.name = 'A skill with this name already exists.'
    }
    if (!entry.passCriteria.trim()) next.passCriteria = 'This field is required'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSubmit({ activities: [], ...initial, ...entry })
    setErrors({})
    setOpened(false)
  }

  return (
    <Popover opened={opened} onChange={setOpened} position="bottom-start" withArrow trapFocus>
      <Popover.Target>{trigger(toggle)}</Popover.Target>
      <Popover.Dropdown w={360}>
        <Stack gap="xs">
          <TextInput
            label="Skill name"
            labelProps={upperLabel}
            size="xs"
            placeholder="e.g. Back Float"
            value={entry.name}
            onChange={(event) => setEntry({ ...entry, name: event.currentTarget.value })}
            error={errors.name}
          />
          <TextInput
            label="Pass criteria"
            labelProps={upperLabel}
            size="xs"
            placeholder="e.g. 10 seconds unassisted"
            value={entry.passCriteria}
            onChange={(event) => setEntry({ ...entry, passCriteria: event.currentTarget.value })}
            error={errors.passCriteria}
          />
          <Textarea
            label="Skill description (optional)"
            labelProps={upperLabel}
            size="xs"
            autosize
            minRows={2}
            value={entry.description}
            onChange={(event) => setEntry({ ...entry, description: event.currentTarget.value })}
          />
          <Group justify="flex-end">
            <Button type="button" size="xs" onClick={submit}>
              {submitLabel}
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}

// Popover form for adding or editing an activity on a skill. Defaults to the
// dashed "+" trigger; pass `trigger` (e.g. a pencil) to edit an existing one.
function ActivityPopover({
  initial,
  submitLabel = 'Add',
  onSubmit,
  trigger,
}: {
  initial?: StageActivityDraft
  submitLabel?: string
  onSubmit: (activity: StageActivityDraft) => void
  trigger?: (open: () => void) => React.ReactNode
}) {
  const [opened, setOpened] = useState(false)
  const blank = () => ({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    applicationNotes: initial?.applicationNotes ?? '',
  })
  const [entry, setEntry] = useState(blank)
  const [errors, setErrors] = useState<{ name?: string }>({})

  const toggle = () => {
    setEntry(blank())
    setErrors({})
    setOpened((value) => !value)
  }

  const submit = () => {
    const next: typeof errors = {}
    if (!entry.name.trim()) next.name = 'This field is required'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSubmit({ ...initial, ...entry })
    setErrors({})
    setOpened(false)
  }

  const target = trigger ? (
    trigger(toggle)
  ) : (
    <Tooltip label="Add activity">
      <ActionIcon
        variant="default"
        radius="xl"
        size="md"
        style={{ borderStyle: 'dashed' }}
        aria-label="Add activity"
        onClick={toggle}
      >
        <IconPlus size={14} />
      </ActionIcon>
    </Tooltip>
  )

  return (
    <Popover opened={opened} onChange={setOpened} position="bottom-start" withArrow trapFocus>
      <Popover.Target>{target}</Popover.Target>
      <Popover.Dropdown w={360}>
        <Stack gap="xs">
          <TextInput
            label="Activity name"
            labelProps={upperLabel}
            size="xs"
            value={entry.name}
            onChange={(event) => setEntry({ ...entry, name: event.currentTarget.value })}
            error={errors.name}
          />
          <Textarea
            label="Activity description (optional)"
            labelProps={upperLabel}
            size="xs"
            autosize
            minRows={2}
            value={entry.description}
            onChange={(event) => setEntry({ ...entry, description: event.currentTarget.value })}
          />
          <Textarea
            label="Application notes (optional)"
            labelProps={upperLabel}
            size="xs"
            autosize
            minRows={2}
            value={entry.applicationNotes}
            onChange={(event) =>
              setEntry({ ...entry, applicationNotes: event.currentTarget.value })
            }
          />
          <Group justify="flex-end">
            <Button type="button" size="xs" onClick={submit}>
              {submitLabel}
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}

function SkillBranch({
  skill,
  otherSkillNames,
  onUpdate,
  onRemove,
  onAddActivity,
  onUpdateActivity,
  onRemoveActivity,
}: {
  skill: StageSkillDraft
  otherSkillNames: string[]
  onUpdate: (skill: StageSkillDraft) => void
  onRemove: () => void
  onAddActivity: (activity: StageActivityDraft) => void
  onUpdateActivity: (index: number, activity: StageActivityDraft) => void
  onRemoveActivity: (index: number) => void
}) {
  return (
    <Card withBorder shadow="none" padding={0} radius="md">
      <Box
        p="sm"
        px="md"
        bg="gray.0"
        style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
      >
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Group gap="sm" wrap="wrap">
            <Text fw={800} size="sm">
              {skill.name}
            </Text>
            <Badge variant="light" size="sm">
              Pass: {skill.passCriteria}
            </Badge>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <ActivityPopover onSubmit={onAddActivity} />
            <SkillPopover
              existingNames={otherSkillNames}
              initial={skill}
              submitLabel="Save"
              onSubmit={onUpdate}
              trigger={(open) => (
                <Tooltip label="Edit skill">
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    aria-label={`Edit skill ${skill.name}`}
                    onClick={open}
                  >
                    <IconPencil size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
            />
            <Tooltip label="Remove skill">
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                aria-label={`Remove skill ${skill.name}`}
                onClick={onRemove}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
        {skill.description && (
          <Text size="xs" c="dimmed" mt={4}>
            {skill.description}
          </Text>
        )}
      </Box>
      {skill.activities.length === 0 ? (
        <Text size="sm" c="dimmed" p="sm" px="md">
          No activities yet — add one from the header.
        </Text>
      ) : (
        <Table verticalSpacing="xs" horizontalSpacing="md" fz="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Activity</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Application notes</Table.Th>
              <Table.Th w={76} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {skill.activities.map((activity, index) => (
              <Table.Tr key={index}>
                <Table.Td fw={700} style={{ whiteSpace: 'nowrap' }}>
                  {activity.name}
                </Table.Td>
                <Table.Td c="dimmed">{activity.description || '—'}</Table.Td>
                <Table.Td c="dimmed">{activity.applicationNotes || '—'}</Table.Td>
                <Table.Td>
                  <Group gap={4} wrap="nowrap" justify="flex-end">
                    <ActivityPopover
                      initial={activity}
                      submitLabel="Save"
                      onSubmit={(updated) => onUpdateActivity(index, updated)}
                      trigger={(open) => (
                        <Tooltip label="Edit activity">
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            aria-label={`Edit activity ${activity.name}`}
                            onClick={open}
                          >
                            <IconPencil size={14} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    />
                    <Tooltip label="Remove activity">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        aria-label={`Remove activity ${activity.name}`}
                        onClick={() => onRemoveActivity(index)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  )
}

export default function StageTree({
  stages,
  onEditStage,
  onRemoveStage,
  onAddSkill,
  onUpdateSkill,
  onRemoveSkill,
  onAddActivity,
  onUpdateActivity,
  onRemoveActivity,
}: {
  stages: StageDraft[]
  onEditStage: (stageIndex: number) => void
  onRemoveStage: (stageIndex: number) => void
  onAddSkill: (stageIndex: number, skill: StageSkillDraft) => void
  onUpdateSkill: (stageIndex: number, skillIndex: number, skill: StageSkillDraft) => void
  onRemoveSkill: (stageIndex: number, skillIndex: number) => void
  onAddActivity: (stageIndex: number, skillIndex: number, activity: StageActivityDraft) => void
  onUpdateActivity: (
    stageIndex: number,
    skillIndex: number,
    activityIndex: number,
    activity: StageActivityDraft
  ) => void
  onRemoveActivity: (stageIndex: number, skillIndex: number, activityIndex: number) => void
}) {
  const ordered = stages
    .map((stage, stageIndex) => ({ stage, stageIndex }))
    .sort((a, b) => Number(a.stage.position) - Number(b.stage.position))

  return (
    <Stack gap="sm">
      {ordered.map(({ stage, stageIndex }) => {
        const activityCount = stage.skills.reduce((total, s) => total + s.activities.length, 0)
        return (
          <Card key={stageIndex} withBorder padding="md" shadow="none">
            <Stack gap="sm">
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon variant="light" radius="xl" size="md">
                    <Text size="xs" fw={700}>
                      {stage.position}
                    </Text>
                  </ThemeIcon>
                  <Text fw={700}>{stage.name}</Text>
                  {stage.code && (
                    <Text size="xs" c="dimmed">
                      {stage.code}
                    </Text>
                  )}
                  <Text size="sm" c="dimmed">
                    {stage.skills.length === 0
                      ? 'no skills yet'
                      : `${countLabel(stage.skills.length, 'skill', 'skills')} · ${countLabel(activityCount, 'activity', 'activities')}`}
                  </Text>
                </Group>
                <Group gap="xs" wrap="nowrap">
                  <Tooltip label="Edit stage">
                    <ActionIcon
                      variant="default"
                      aria-label="Edit stage"
                      onClick={() => onEditStage(stageIndex)}
                    >
                      <IconPencil size={14} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Remove stage">
                    <ActionIcon
                      variant="default"
                      color="red"
                      aria-label="Remove stage"
                      onClick={() => onRemoveStage(stageIndex)}
                    >
                      <IconTrash size={14} color="var(--mantine-color-red-7)" />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>

              {stage.skills.length === 0 ? (
                <Card bg="gray.0" padding="sm" shadow="none">
                  <Group justify="space-between" align="center">
                    <Text size="sm">Add a skill, then attach activities to it.</Text>
                    <SkillPopover
                      existingNames={stage.skills.map((skill) => skill.name)}
                      onSubmit={(skill) => onAddSkill(stageIndex, skill)}
                      trigger={(open) => (
                        <Button type="button" variant="default" size="xs" onClick={open}>
                          Add skill
                        </Button>
                      )}
                    />
                  </Group>
                </Card>
              ) : (
                <>
                  <Stack gap="md" pl={40}>
                    {stage.skills.map((skill, skillIndex) => (
                      <SkillBranch
                        key={skillIndex}
                        skill={skill}
                        otherSkillNames={stage.skills
                          .filter((_, i) => i !== skillIndex)
                          .map((s) => s.name)}
                        onUpdate={(updated) => onUpdateSkill(stageIndex, skillIndex, updated)}
                        onRemove={() => onRemoveSkill(stageIndex, skillIndex)}
                        onAddActivity={(activity) =>
                          onAddActivity(stageIndex, skillIndex, activity)
                        }
                        onUpdateActivity={(activityIndex, activity) =>
                          onUpdateActivity(stageIndex, skillIndex, activityIndex, activity)
                        }
                        onRemoveActivity={(activityIndex) =>
                          onRemoveActivity(stageIndex, skillIndex, activityIndex)
                        }
                      />
                    ))}
                  </Stack>
                  <div>
                    <SkillPopover
                      existingNames={stage.skills.map((skill) => skill.name)}
                      onSubmit={(skill) => onAddSkill(stageIndex, skill)}
                      trigger={(open) => (
                        <Button
                          type="button"
                          variant="default"
                          size="xs"
                          leftSection={<IconPlus size={14} />}
                          onClick={open}
                        >
                          Add skill
                        </Button>
                      )}
                    />
                  </div>
                </>
              )}
            </Stack>
          </Card>
        )
      })}
    </Stack>
  )
}
