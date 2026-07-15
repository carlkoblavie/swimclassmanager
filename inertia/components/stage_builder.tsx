import { type ChangeEvent, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
} from '@mantine/core'
import { IconCircleCheck, IconLadder, IconTrash } from '@tabler/icons-react'

export type StageActivityDraft = {
  name: string
  durationMinutes: string // as entered
  description: string
  applicationNotes: string
}

export type StageSkillDraft = {
  name: string
  passCriteria: string
  description: string
  activities: StageActivityDraft[]
}

export type StageDraft = {
  name: string
  position: string // as entered
  description: string
  skills: StageSkillDraft[]
}

export function emptyStageDraft(position: number): StageDraft {
  return { name: '', position: String(position), description: '', skills: [] }
}

type Props = {
  onCancel: () => void
  onSave: (draft: StageDraft) => void
  nextPosition: number
  initial?: StageDraft
}

const upperLabel = { tt: 'uppercase', fz: 'xs', c: 'dimmed', fw: 600 } as const

// One skill card: name, pass criteria, and the drills used to teach it.
function SkillCard({
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
  const [adding, setAdding] = useState(false)
  const [entry, setEntry] = useState<StageActivityDraft>({
    name: '',
    durationMinutes: '',
    description: '',
    applicationNotes: '',
  })
  const [entryErrors, setEntryErrors] = useState<{ name?: string; durationMinutes?: string }>({})

  const confirmActivity = () => {
    const next: typeof entryErrors = {}
    if (!entry.name.trim()) next.name = 'This field is required'
    if (!entry.durationMinutes.trim()) next.durationMinutes = 'This field is required'
    setEntryErrors(next)
    if (Object.keys(next).length > 0) return

    onAddActivity(entry)
    setEntry({ name: '', durationMinutes: '', description: '', applicationNotes: '' })
    setEntryErrors({})
    setAdding(false)
  }

  return (
    <Card bg="gray.0" padding="sm">
      <Stack gap={6}>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <div>
            <Text fw={600} size="sm">
              {skill.name}
            </Text>
            <Text size="sm" c="dimmed">
              {skill.passCriteria}
            </Text>
            {skill.description.trim() !== '' && (
              <Text size="xs" c="dimmed" fs="italic">
                {skill.description}
              </Text>
            )}
          </div>
          <ActionIcon
            variant="subtle"
            color="red"
            aria-label={`Remove skill ${skill.name}`}
            onClick={onRemove}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>

        <Group justify="space-between">
          <Text {...upperLabel}>Activities & drills</Text>
          <Button
            type="button"
            variant="subtle"
            size="compact-sm"
            onClick={() => setAdding(true)}
          >
            Add activity
          </Button>
        </Group>

        {adding && (
          <Stack gap="xs">
            <Group gap="xs" align="flex-start">
              <TextInput
                label="Activity name"
                labelProps={upperLabel}
                size="xs"
                flex={2}
                value={entry.name}
                onChange={(event) => setEntry({ ...entry, name: event.currentTarget.value })}
                error={entryErrors.name}
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
                error={entryErrors.durationMinutes}
              />
            </Group>
            <TextInput
              label="Activity description (optional)"
              labelProps={upperLabel}
              size="xs"
              value={entry.description}
              onChange={(event) => setEntry({ ...entry, description: event.currentTarget.value })}
            />
            <Group gap="xs" align="flex-end">
              <TextInput
                label="Application notes (optional)"
                labelProps={upperLabel}
                size="xs"
                flex={1}
                value={entry.applicationNotes}
                onChange={(event) =>
                  setEntry({ ...entry, applicationNotes: event.currentTarget.value })
                }
              />
              <Button type="button" size="xs" onClick={confirmActivity}>
                Add
              </Button>
            </Group>
          </Stack>
        )}

        {skill.activities.map((activity, index) => (
          <Card key={index} padding="xs" bg="white" withBorder>
            <Group justify="space-between" align="center" wrap="nowrap">
              <div>
                <Group gap="xs" wrap="nowrap">
                  <Text fw={500} size="sm">
                    {activity.name}
                  </Text>
                  <Group gap={4} wrap="nowrap">
                    <IconCircleCheck size={14} color="var(--mantine-color-green-6)" />
                    <Text size="xs" c="dimmed" tt="uppercase">
                      {activity.durationMinutes} mins
                    </Text>
                  </Group>
                </Group>
                {activity.description.trim() !== '' && (
                  <Text size="xs" c="dimmed">
                    {activity.description}
                  </Text>
                )}
                {activity.applicationNotes.trim() !== '' && (
                  <Text size="xs" c="dimmed" fs="italic">
                    Notes: {activity.applicationNotes}
                  </Text>
                )}
              </div>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                aria-label={`Remove activity ${activity.name}`}
                onClick={() => onRemoveActivity(index)}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          </Card>
        ))}
      </Stack>
    </Card>
  )
}

// Inline single-column stage editor, rendered beneath its level card.
export default function StageBuilder({ onCancel, onSave, nextPosition, initial }: Props) {
  const [draft, setDraft] = useState<StageDraft>(initial ?? emptyStageDraft(nextPosition))
  const [errors, setErrors] = useState<{ name?: string; position?: string }>({})

  const [skillEntry, setSkillEntry] = useState<{
    name: string
    passCriteria: string
    description: string
  }>({ name: '', passCriteria: '', description: '' })
  const [skillErrors, setSkillErrors] = useState<{ name?: string; passCriteria?: string }>({})

  const set =
    (field: 'name' | 'position' | 'description') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.currentTarget.value
      setDraft((current) => ({ ...current, [field]: value }))
    }

  const addSkill = () => {
    const next: typeof skillErrors = {}
    if (!skillEntry.name.trim()) {
      next.name = 'This field is required'
    } else if (
      draft.skills.some(
        (skill) => skill.name.trim().toLowerCase() === skillEntry.name.trim().toLowerCase()
      )
    ) {
      next.name = 'A skill with this name already exists.'
    }
    if (!skillEntry.passCriteria.trim()) next.passCriteria = 'This field is required'
    setSkillErrors(next)
    if (Object.keys(next).length > 0) return

    setDraft((current) => ({
      ...current,
      skills: [...current.skills, { ...skillEntry, activities: [] }],
    }))
    setSkillEntry({ name: '', passCriteria: '', description: '' })
  }

  const removeSkill = (index: number) =>
    setDraft((current) => ({
      ...current,
      skills: current.skills.filter((_, i) => i !== index),
    }))

  const addActivity = (skillIndex: number, activity: StageActivityDraft) =>
    setDraft((current) => ({
      ...current,
      skills: current.skills.map((skill, i) =>
        i === skillIndex ? { ...skill, activities: [...skill.activities, activity] } : skill
      ),
    }))

  const removeActivity = (skillIndex: number, activityIndex: number) =>
    setDraft((current) => ({
      ...current,
      skills: current.skills.map((skill, i) =>
        i === skillIndex
          ? { ...skill, activities: skill.activities.filter((_, a) => a !== activityIndex) }
          : skill
      ),
    }))

  const submit = () => {
    const next: typeof errors = {}
    if (!draft.name.trim()) next.name = 'This field is required'
    if (!draft.position.trim()) next.position = 'This field is required'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSave(draft)
  }

  return (
    <Card mt="sm" padding="md">
      <Stack gap="sm">
        <div>
          <Text fw={700}>{initial ? 'Edit stage' : 'Create a stage'}</Text>
          <Text size="xs" c="dimmed">
            Define the requirements and curriculum for this milestone.
          </Text>
        </div>

        <Group gap="sm" align="flex-start">
          <TextInput
            label="Stage name"
            size="sm"
            flex={1}
            value={draft.name}
            onChange={set('name')}
            error={errors.name}
          />
          <TextInput
            label="Order"
            type="number"
            size="sm"
            w={90}
            value={draft.position}
            onChange={set('position')}
            error={errors.position}
          />
        </Group>
        <Textarea
          label="Stage description (optional)"
          size="sm"
          value={draft.description}
          onChange={set('description')}
          autosize
          minRows={2}
          placeholder="Brief overview of what this stage aims to achieve…"
        />

        <Divider />

        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon variant="light" size="md" radius="md">
              <IconLadder size={16} stroke={1.6} />
            </ThemeIcon>
            <div>
              <Text fw={600} size="sm">
                Curriculum
              </Text>
              <Text size="xs" c="dimmed">
                Define skills and the drills used to teach them.
              </Text>
            </div>
          </Group>
          <Badge variant="light" color="gray">
            {draft.skills.length} {draft.skills.length === 1 ? 'skill' : 'skills'}
          </Badge>
        </Group>

        <Card bg="gray.0" padding="sm">
          <Stack gap="xs">
            <Group gap="xs" align="flex-start">
              <TextInput
                label="Skill name"
                labelProps={upperLabel}
                size="xs"
                placeholder="e.g. Back Float"
                flex={1}
                value={skillEntry.name}
                onChange={(event) =>
                  setSkillEntry({ ...skillEntry, name: event.currentTarget.value })
                }
                error={skillErrors.name}
              />
              <TextInput
                label="Pass criteria"
                labelProps={upperLabel}
                size="xs"
                placeholder="e.g. 10 seconds unassisted"
                flex={2}
                value={skillEntry.passCriteria}
                onChange={(event) =>
                  setSkillEntry({ ...skillEntry, passCriteria: event.currentTarget.value })
                }
                error={skillErrors.passCriteria}
              />
            </Group>
            <Group gap="xs" align="flex-end">
              <TextInput
                label="Skill description (optional)"
                labelProps={upperLabel}
                size="xs"
                flex={1}
                value={skillEntry.description}
                onChange={(event) =>
                  setSkillEntry({ ...skillEntry, description: event.currentTarget.value })
                }
              />
              <Button type="button" size="xs" onClick={addSkill}>
                Add skill
              </Button>
            </Group>
          </Stack>
        </Card>

        {draft.skills.map((skill, index) => (
          <SkillCard
            key={index}
            skill={skill}
            onRemove={() => removeSkill(index)}
            onAddActivity={(activity) => addActivity(index, activity)}
            onRemoveActivity={(activityIndex) => removeActivity(index, activityIndex)}
          />
        ))}

        <Divider />

        <Group justify="flex-end" gap="sm">
          <Button type="button" size="sm" variant="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={submit}>
            Save stage
          </Button>
        </Group>
      </Stack>
    </Card>
  )
}
