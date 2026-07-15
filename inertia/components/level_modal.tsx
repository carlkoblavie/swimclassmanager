import { type ChangeEvent, useState } from 'react'
import {
  ActionIcon,
  Button,
  Divider,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'

export type StageDraft = {
  name: string
  position: string // as entered
  completionRequirement: string
}

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
type StageField = keyof StageDraft

const REQUIRED: LevelField[] = ['name', 'ageGroup', 'description', 'defaultFee', 'capacity']
const STAGE_REQUIRED: StageField[] = ['name', 'position', 'completionRequirement']

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
  const [stageErrors, setStageErrors] = useState<
    Record<number, Partial<Record<StageField, string>>>
  >({})

  const set =
    (field: LevelField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.currentTarget.value
      setDraft((current) => ({ ...current, [field]: value }))
    }

  const setStage =
    (index: number, field: StageField) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value
      setDraft((current) => ({
        ...current,
        stages: current.stages.map((stage, i) =>
          i === index ? { ...stage, [field]: value } : stage
        ),
      }))
    }

  const addStage = () =>
    setDraft((current) => ({
      ...current,
      stages: [
        ...current.stages,
        { name: '', position: String(current.stages.length + 1), completionRequirement: '' },
      ],
    }))

  const removeStage = (index: number) =>
    setDraft((current) => ({
      ...current,
      stages: current.stages.filter((_, i) => i !== index),
    }))

  const submit = () => {
    const next: Partial<Record<LevelField, string>> = {}
    for (const field of REQUIRED) {
      if (!String(draft[field]).trim()) next[field] = 'This field is required'
    }

    const nextStageErrors: Record<number, Partial<Record<StageField, string>>> = {}
    draft.stages.forEach((stage, index) => {
      for (const field of STAGE_REQUIRED) {
        if (!String(stage[field]).trim()) {
          nextStageErrors[index] = {
            ...nextStageErrors[index],
            [field]: 'This field is required',
          }
        }
      }
    })

    if (Object.keys(next).length > 0 || Object.keys(nextStageErrors).length > 0) {
      setErrors(next)
      setStageErrors(nextStageErrors)
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

      <Divider />

      <Group justify="space-between">
        <div>
          <Text fw={600} size="sm">
            Stages within this level
          </Text>
          <Text size="xs" c="dimmed">
            The ordered milestones a swimmer completes to pass the level.
          </Text>
        </div>
        <Button variant="light" size="xs" onClick={addStage}>
          Add stage
        </Button>
      </Group>

      {draft.stages.length === 0 ? (
        <Text c="dimmed" size="sm">
          No stages added yet.
        </Text>
      ) : (
        draft.stages.map((stage, index) => (
          <Group key={index} gap="sm" align="flex-start" wrap="nowrap">
            <TextInput
              label="Stage name"
              flex={1}
              value={stage.name}
              onChange={setStage(index, 'name')}
              error={stageErrors[index]?.name}
            />
            <TextInput
              label="Order"
              type="number"
              w={80}
              value={stage.position}
              onChange={setStage(index, 'position')}
              error={stageErrors[index]?.position}
            />
            <TextInput
              label="Completion requirement"
              flex={1}
              value={stage.completionRequirement}
              onChange={setStage(index, 'completionRequirement')}
              error={stageErrors[index]?.completionRequirement}
            />
            <ActionIcon
              variant="subtle"
              color="red"
              mt={28}
              aria-label={`Remove stage ${index + 1}`}
              onClick={() => removeStage(index)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        ))
      )}

      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={submit}>{submitLabel}</Button>
      </Group>
    </Stack>
  )
}
