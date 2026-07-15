import { type ChangeEvent, useState } from 'react'
import { Button, Card, Group, Stack, Text, Textarea, TextInput } from '@mantine/core'

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

// Inline stage identity editor: name, order, and description. Skills and
// activities are managed on the stage tree, not here.
export default function StageBuilder({ onCancel, onSave, nextPosition, initial }: Props) {
  const [draft, setDraft] = useState<StageDraft>(initial ?? emptyStageDraft(nextPosition))
  const [errors, setErrors] = useState<{ name?: string; position?: string }>({})

  const set =
    (field: 'name' | 'position' | 'description') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.currentTarget.value
      setDraft((current) => ({ ...current, [field]: value }))
    }

  const submit = () => {
    const next: typeof errors = {}
    if (!draft.name.trim()) next.name = 'This field is required'
    if (!draft.position.trim()) next.position = 'This field is required'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSave(draft)
  }

  return (
    <Card mt="sm" padding="md" bg="gray.0">
      <Stack gap="sm">
        <div>
          <Text fw={700}>{initial ? 'Edit stage' : 'Create a stage'}</Text>
          <Text size="xs" c="dimmed">
            Name the milestone; add its skills and activities from the stage list.
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
