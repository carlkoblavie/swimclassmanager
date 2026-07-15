import { type ChangeEvent, useState } from 'react'
import { Button, Group, Modal, SimpleGrid, Stack, Textarea, TextInput } from '@mantine/core'
import type { StageDraft } from '~/components/stage_builder'

export type LevelDraft = {
  id?: number
  name: string
  ageGroup: string
  description: string
  defaultFee: string // cedis, as entered
  capacity: string
  stages: StageDraft[]
}

type Props = {
  opened: boolean
  onClose: () => void
  onSave: (draft: LevelDraft) => void
  initial?: LevelDraft
}

type LevelField = 'name' | 'ageGroup' | 'description' | 'defaultFee' | 'capacity'

const REQUIRED: LevelField[] = ['name', 'ageGroup', 'description', 'defaultFee', 'capacity']

function emptyDraft(): LevelDraft {
  return { name: '', ageGroup: '', description: '', defaultFee: '', capacity: '', stages: [] }
}

export default function LevelModal({ opened, onClose, onSave, initial }: Props) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={initial ? 'Edit level' : 'Add level'}
      size="lg"
      centered
    >
      <LevelForm
        initial={initial}
        submitLabel="Save level"
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
  initial?: LevelDraft
  submitLabel: string
  onCancel: () => void
  onSubmit: (draft: LevelDraft) => void
}

function LevelForm({ initial, submitLabel, onCancel, onSubmit }: FormProps) {
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
    onSubmit(draft)
  }

  return (
    <Stack gap="md">
      <TextInput label="Level name" value={draft.name} onChange={set('name')} error={errors.name} />
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput
          label="Age group"
          value={draft.ageGroup}
          onChange={set('ageGroup')}
          error={errors.ageGroup}
        />
        <TextInput
          label="Capacity"
          type="number"
          value={draft.capacity}
          onChange={set('capacity')}
          error={errors.capacity}
        />
      </SimpleGrid>
      <TextInput
        label="Fee (GHS)"
        type="number"
        value={draft.defaultFee}
        onChange={set('defaultFee')}
        error={errors.defaultFee}
      />
      <Textarea
        label="Level description"
        value={draft.description}
        onChange={set('description')}
        error={errors.description}
        autosize
        minRows={2}
      />
      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={submit}>{submitLabel}</Button>
      </Group>
    </Stack>
  )
}
