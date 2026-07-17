import { type ChangeEvent, useState } from 'react'
import { Button, Card, Group, Stack, Textarea, TextInput, Title } from '@mantine/core'
import type { StageDraft } from '~/components/stage_builder'

export type LevelDraft = {
  id?: number
  code?: string
  name: string
  ageGroup: string
  description: string
  defaultFee: string // cedis, as entered
  stages: StageDraft[]
}

type LevelField = 'name' | 'ageGroup' | 'description' | 'defaultFee'

const REQUIRED: LevelField[] = ['name', 'ageGroup', 'description', 'defaultFee']

function emptyDraft(): LevelDraft {
  return { name: '', ageGroup: '', description: '', defaultFee: '', stages: [] }
}

export default function LevelForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: LevelDraft
  onCancel: () => void
  onSave: (draft: LevelDraft) => void
}) {
  const [draft, setDraft] = useState<LevelDraft>(initial ?? emptyDraft())
  const [errors, setErrors] = useState<Partial<Record<LevelField, string>>>({})

  const set =
    (field: LevelField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.currentTarget.value
      setDraft((current) => ({ ...current, [field]: value }))
    }

  const submit = () => {
    const next: Partial<Record<LevelField, string>> = {}
    for (const field of REQUIRED) {
      if (!String(draft[field]).trim()) next[field] = 'This field is required'
    }
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }
    onSave(draft)
  }

  return (
    <Card bg="gray.0" shadow="none">
      <Stack gap="md">
        <Title order={3} fz="lg">
          {initial ? 'Edit level' : 'Add level'}
        </Title>
        <TextInput
          label="Level name"
          value={draft.name}
          onChange={set('name')}
          error={errors.name}
        />
        <Group gap="md" align="flex-start">
          <TextInput
            label="Age group"
            flex={1}
            value={draft.ageGroup}
            onChange={set('ageGroup')}
            error={errors.ageGroup}
          />
          <TextInput
            label="Fee (GHS)"
            type="number"
            flex={1}
            value={draft.defaultFee}
            onChange={set('defaultFee')}
            error={errors.defaultFee}
          />
        </Group>
        <Textarea
          label="Level description"
          value={draft.description}
          onChange={set('description')}
          error={errors.description}
          autosize
          minRows={2}
        />
        <Group justify="flex-end">
          <Button type="button" variant="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={submit}>
            Save level
          </Button>
        </Group>
      </Stack>
    </Card>
  )
}
