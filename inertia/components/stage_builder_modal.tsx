import { type ChangeEvent, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  Modal,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
} from '@mantine/core'
import { IconRipple, IconShield, IconTrash } from '@tabler/icons-react'

export type StageSkillDraft = {
  name: string
  passCriteria: string
}

export type StageActivityDraft = {
  name: string
  durationMinutes: string // as entered
}

export type StageDraft = {
  name: string
  position: string // as entered
  description: string
  skills: StageSkillDraft[]
  activities: StageActivityDraft[]
}

export function emptyStageDraft(position: number): StageDraft {
  return { name: '', position: String(position), description: '', skills: [], activities: [] }
}

type Props = {
  opened: boolean
  onClose: () => void
  onSave: (draft: StageDraft) => void
  levelName: string
  nextPosition: number
  initial?: StageDraft
}

function BankHeading({
  icon,
  title,
  subtitle,
  count,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  count: number
}) {
  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap">
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon variant="light" size="md" radius="md">
          {icon}
        </ThemeIcon>
        <div>
          <Text fw={600}>{title}</Text>
          <Text size="xs" c="dimmed">
            {subtitle}
          </Text>
        </div>
      </Group>
      <Badge variant="light" color="gray">
        {count} {count === 1 ? 'item' : 'items'}
      </Badge>
    </Group>
  )
}

export default function StageBuilderModal({
  opened,
  onClose,
  onSave,
  levelName,
  nextPosition,
  initial,
}: Props) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={initial ? 'Edit stage' : 'Create a stage'}
      size="72rem"
      centered
    >
      <StageForm
        initial={initial}
        levelName={levelName}
        nextPosition={nextPosition}
        onCancel={onClose}
        onSubmit={(draft) => {
          onSave(draft)
          onClose()
        }}
      />
    </Modal>
  )
}

type FormProps = {
  initial?: StageDraft
  levelName: string
  nextPosition: number
  onCancel: () => void
  onSubmit: (draft: StageDraft) => void
}

function StageForm({ initial, levelName, nextPosition, onCancel, onSubmit }: FormProps) {
  const [draft, setDraft] = useState<StageDraft>(initial ?? emptyStageDraft(nextPosition))
  const [errors, setErrors] = useState<{ name?: string; position?: string }>({})

  const [skillEntry, setSkillEntry] = useState<StageSkillDraft>({ name: '', passCriteria: '' })
  const [skillErrors, setSkillErrors] = useState<{ name?: string; passCriteria?: string }>({})

  const [activityEntry, setActivityEntry] = useState<StageActivityDraft>({
    name: '',
    durationMinutes: '',
  })
  const [activityErrors, setActivityErrors] = useState<{
    name?: string
    durationMinutes?: string
  }>({})

  const set =
    (field: 'name' | 'position' | 'description') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.currentTarget.value
      setDraft((current) => ({ ...current, [field]: value }))
    }

  const addSkill = () => {
    const next: typeof skillErrors = {}
    if (!skillEntry.name.trim()) next.name = 'This field is required'
    if (!skillEntry.passCriteria.trim()) next.passCriteria = 'This field is required'
    setSkillErrors(next)
    if (Object.keys(next).length > 0) return

    setDraft((current) => ({ ...current, skills: [...current.skills, skillEntry] }))
    setSkillEntry({ name: '', passCriteria: '' })
  }

  const removeSkill = (index: number) =>
    setDraft((current) => ({
      ...current,
      skills: current.skills.filter((_, i) => i !== index),
    }))

  const addActivity = () => {
    const next: typeof activityErrors = {}
    if (!activityEntry.name.trim()) next.name = 'This field is required'
    if (!activityEntry.durationMinutes.trim()) next.durationMinutes = 'This field is required'
    setActivityErrors(next)
    if (Object.keys(next).length > 0) return

    setDraft((current) => ({ ...current, activities: [...current.activities, activityEntry] }))
    setActivityEntry({ name: '', durationMinutes: '' })
  }

  const removeActivity = (index: number) =>
    setDraft((current) => ({
      ...current,
      activities: current.activities.filter((_, i) => i !== index),
    }))

  const submit = () => {
    const next: typeof errors = {}
    if (!draft.name.trim()) next.name = 'This field is required'
    if (!draft.position.trim()) next.position = 'This field is required'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSubmit(draft)
  }

  return (
    <Stack gap="md">
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            <div>
              <Text fw={600}>Stage identity</Text>
              <Text size="xs" c="dimmed">
                General information about this stage.
              </Text>
            </div>
            <TextInput
              label="Stage name"
              value={draft.name}
              onChange={set('name')}
              error={errors.name}
            />
            <TextInput
              label="Order"
              type="number"
              value={draft.position}
              onChange={set('position')}
              error={errors.position}
            />
            <TextInput label="Level hierarchy" value={levelName} readOnly disabled />
            <Textarea
              label="Stage description (optional)"
              value={draft.description}
              onChange={set('description')}
              autosize
              minRows={3}
              placeholder="Brief overview of what this stage aims to achieve…"
            />
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            <BankHeading
              icon={<IconShield size={16} stroke={1.6} />}
              title="Skill bank (pass requirements)"
              subtitle="The specific competencies required to graduate from this stage."
              count={draft.skills.length}
            />
            <Card bg="gray.0">
              <Group gap="sm" align="flex-start">
                <TextInput
                  label="Skill name"
                  flex={1}
                  value={skillEntry.name}
                  onChange={(event) =>
                    setSkillEntry({ ...skillEntry, name: event.currentTarget.value })
                  }
                  error={skillErrors.name}
                />
                <TextInput
                  label="Pass criteria"
                  flex={2}
                  value={skillEntry.passCriteria}
                  onChange={(event) =>
                    setSkillEntry({ ...skillEntry, passCriteria: event.currentTarget.value })
                  }
                  error={skillErrors.passCriteria}
                />
                <Button mt={25} onClick={addSkill}>
                  Add skill
                </Button>
              </Group>
            </Card>
            {draft.skills.map((skill, index) => (
              <Card key={index} padding="sm">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <div>
                    <Text fw={500}>{skill.name}</Text>
                    <Text size="sm" c="dimmed">
                      {skill.passCriteria}
                    </Text>
                  </div>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label={`Remove skill ${skill.name}`}
                    onClick={() => removeSkill(index)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Card>
            ))}

            <Divider />

            <BankHeading
              icon={<IconRipple size={16} stroke={1.6} />}
              title="Activity bank (drills & exercises)"
              subtitle="Standardized drills used for instruction in this stage."
              count={draft.activities.length}
            />
            <Card bg="gray.0">
              <Group gap="sm" align="flex-start">
                <TextInput
                  label="Activity name"
                  flex={2}
                  value={activityEntry.name}
                  onChange={(event) =>
                    setActivityEntry({ ...activityEntry, name: event.currentTarget.value })
                  }
                  error={activityErrors.name}
                />
                <TextInput
                  label="Duration (mins)"
                  type="number"
                  flex={1}
                  value={activityEntry.durationMinutes}
                  onChange={(event) =>
                    setActivityEntry({
                      ...activityEntry,
                      durationMinutes: event.currentTarget.value,
                    })
                  }
                  error={activityErrors.durationMinutes}
                />
                <Button mt={25} variant="light" onClick={addActivity}>
                  Add activity
                </Button>
              </Group>
            </Card>
            {draft.activities.map((activity, index) => (
              <Card key={index} padding="sm">
                <Group justify="space-between" align="center" wrap="nowrap">
                  <div>
                    <Text fw={500}>{activity.name}</Text>
                    <Text size="xs" c="dimmed" tt="uppercase">
                      Typical duration: {activity.durationMinutes} mins
                    </Text>
                  </div>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label={`Remove activity ${activity.name}`}
                    onClick={() => removeActivity(index)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Card>
            ))}
          </Stack>
        </Grid.Col>
      </Grid>

      <Divider />

      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={submit}>Save stage</Button>
      </Group>
    </Stack>
  )
}
