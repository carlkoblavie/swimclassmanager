import { useState } from 'react'
import {
  ActionIcon,
  Box,
  Button,
  Card,
  Group,
  Pill,
  Popover,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
} from '@mantine/core'
import { IconPencil, IconPlus, IconTarget, IconTrash } from '@tabler/icons-react'
import type { StageActivityDraft, StageDraft, StageSkillDraft } from '~/components/stage_builder'

const upperLabel = { tt: 'uppercase', fz: 'xs', c: 'dimmed', fw: 600 } as const

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

// Popover form for adding a skill to a stage.
function AddSkillPopover({
  existingNames,
  onAdd,
  trigger,
}: {
  existingNames: string[]
  onAdd: (skill: StageSkillDraft) => void
  trigger: (open: () => void) => React.ReactNode
}) {
  const [opened, setOpened] = useState(false)
  const [entry, setEntry] = useState({ name: '', passCriteria: '', description: '' })
  const [errors, setErrors] = useState<{ name?: string; passCriteria?: string }>({})

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

    onAdd({ ...entry, activities: [] })
    setEntry({ name: '', passCriteria: '', description: '' })
    setErrors({})
    setOpened(false)
  }

  return (
    <Popover opened={opened} onChange={setOpened} position="bottom-start" withArrow trapFocus>
      <Popover.Target>{trigger(() => setOpened((value) => !value))}</Popover.Target>
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
              Add
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}

// Popover form for attaching an activity to a skill.
function AddActivityPopover({ onAdd }: { onAdd: (activity: StageActivityDraft) => void }) {
  const [opened, setOpened] = useState(false)
  const [entry, setEntry] = useState({
    name: '',
    durationMinutes: '',
    description: '',
    applicationNotes: '',
  })
  const [errors, setErrors] = useState<{ name?: string; durationMinutes?: string }>({})

  const submit = () => {
    const next: typeof errors = {}
    if (!entry.name.trim()) next.name = 'This field is required'
    if (!entry.durationMinutes.trim()) next.durationMinutes = 'This field is required'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    onAdd(entry)
    setEntry({ name: '', durationMinutes: '', description: '', applicationNotes: '' })
    setErrors({})
    setOpened(false)
  }

  return (
    <Popover opened={opened} onChange={setOpened} position="bottom-start" withArrow trapFocus>
      <Popover.Target>
        <ActionIcon
          variant="default"
          radius="xl"
          size="md"
          style={{ borderStyle: 'dashed' }}
          aria-label="Add activity"
          onClick={() => setOpened((value) => !value)}
        >
          <IconPlus size={14} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown w={360}>
        <Stack gap="xs">
          <Group gap="xs" align="flex-start">
            <TextInput
              label="Activity name"
              labelProps={upperLabel}
              size="xs"
              flex={2}
              value={entry.name}
              onChange={(event) => setEntry({ ...entry, name: event.currentTarget.value })}
              error={errors.name}
            />
            <TextInput
              label="Duration (mins)"
              labelProps={upperLabel}
              size="xs"
              type="number"
              flex={1}
              value={entry.durationMinutes}
              onChange={(event) =>
                setEntry({ ...entry, durationMinutes: event.currentTarget.value })
              }
              error={errors.durationMinutes}
            />
          </Group>
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
              Add
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}

function SkillBranch({
  skill,
  onRemove,
  onAddActivity,
  onRemoveActivity,
}: {
  skill: StageSkillDraft
  onRemove: () => void
  onAddActivity: (activity: StageActivityDraft) => void
  onRemoveActivity: (index: number) => void
}) {
  return (
    <Box
      pl="sm"
      style={{ borderLeft: '2px solid var(--mantine-color-aqua-3)' }}
    >
      <Stack gap={6}>
        <Group gap="xs" wrap="nowrap">
          <IconTarget size={16} stroke={1.8} color="var(--mantine-color-aqua-8)" />
          <Text fw={600} size="sm" c="aqua.8">
            {skill.name}
          </Text>
          <Text size="xs" c="dimmed">
            {countLabel(skill.activities.length, 'activity', 'activities')}
          </Text>
          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            aria-label={`Remove skill ${skill.name}`}
            onClick={onRemove}
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
        <Group gap="xs">
          {skill.activities.map((activity, index) => (
            <Pill
              key={index}
              size="md"
              bg="green.0"
              c="green.9"
              withRemoveButton
              onRemove={() => onRemoveActivity(index)}
              removeButtonProps={{ 'aria-label': `Remove activity ${activity.name}` }}
            >
              {activity.name}
            </Pill>
          ))}
          <AddActivityPopover onAdd={onAddActivity} />
        </Group>
      </Stack>
    </Box>
  )
}

export default function StageTree({
  stages,
  onEditStage,
  onRemoveStage,
  onAddSkill,
  onRemoveSkill,
  onAddActivity,
  onRemoveActivity,
}: {
  stages: StageDraft[]
  onEditStage: (stageIndex: number) => void
  onRemoveStage: (stageIndex: number) => void
  onAddSkill: (stageIndex: number, skill: StageSkillDraft) => void
  onRemoveSkill: (stageIndex: number, skillIndex: number) => void
  onAddActivity: (stageIndex: number, skillIndex: number, activity: StageActivityDraft) => void
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
                  <Text size="sm" c="dimmed">
                    {stage.skills.length === 0
                      ? 'no skills yet'
                      : `${countLabel(stage.skills.length, 'skill', 'skills')} · ${countLabel(activityCount, 'activity', 'activities')}`}
                  </Text>
                </Group>
                <Group gap="xs" wrap="nowrap">
                  <ActionIcon
                    variant="default"
                    aria-label="Edit stage"
                    onClick={() => onEditStage(stageIndex)}
                  >
                    <IconPencil size={14} />
                  </ActionIcon>
                  <ActionIcon
                    variant="default"
                    color="red"
                    aria-label="Remove stage"
                    onClick={() => onRemoveStage(stageIndex)}
                  >
                    <IconTrash size={14} color="var(--mantine-color-red-7)" />
                  </ActionIcon>
                </Group>
              </Group>

              {stage.skills.length === 0 ? (
                <Card bg="gray.0" padding="sm" shadow="none">
                  <Group justify="space-between" align="center">
                    <Text size="sm">Add a skill, then attach activities to it.</Text>
                    <AddSkillPopover
                      existingNames={stage.skills.map((skill) => skill.name)}
                      onAdd={(skill) => onAddSkill(stageIndex, skill)}
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
                        onRemove={() => onRemoveSkill(stageIndex, skillIndex)}
                        onAddActivity={(activity) =>
                          onAddActivity(stageIndex, skillIndex, activity)
                        }
                        onRemoveActivity={(activityIndex) =>
                          onRemoveActivity(stageIndex, skillIndex, activityIndex)
                        }
                      />
                    ))}
                  </Stack>
                  <div>
                    <AddSkillPopover
                      existingNames={stage.skills.map((skill) => skill.name)}
                      onAdd={(skill) => onAddSkill(stageIndex, skill)}
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
