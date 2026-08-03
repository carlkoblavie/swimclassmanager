import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { Button, Card, Group, Stack, Text, Textarea, TextInput } from '@mantine/core'

export type StageActivityDraft = {
  id?: number
  name: string
  description: string
  applicationNotes: string
}

export type StageSkillDraft = {
  id?: number
  familyKey?: string
  familyName?: string
  name: string
  passCriteria: string
  description: string
  activities: StageActivityDraft[]
}

export type StageDraft = {
  id?: number
  code?: string
  name: string
  position: string // as entered
  classesCount: string // lessons assigned from the parent level
  description: string
  skills: StageSkillDraft[]
}

export function emptyStageDraft(position: number): StageDraft {
  return { name: '', position: String(position), classesCount: '', description: '', skills: [] }
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
  const [errors, setErrors] = useState<{ name?: string; position?: string; classesCount?: string }>(
    {}
  )
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const set =
    (field: 'name' | 'position' | 'classesCount' | 'description') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.currentTarget.value
      setDraft((current) => ({ ...current, [field]: value }))
    }

  const submit = () => {
    const next: typeof errors = {}
    if (!draft.name.trim()) next.name = 'This field is required'
    if (!draft.position.trim()) next.position = 'This field is required'
    const classCount = Number(draft.classesCount)
    if (!draft.classesCount.trim()) {
      next.classesCount = 'This field is required'
    } else if (!Number.isInteger(classCount) || classCount <= 0) {
      next.classesCount = 'Enter a whole number greater than 0'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSave(draft)
  }

  return (
    <Card ref={rootRef} mt="sm" padding="md" bg="gray.0" style={{ scrollMarginTop: 76 }}>
      <Stack gap="sm">
        <div>
          <Text fw={700}>{initial ? 'Edit stage' : 'Create a stage'}</Text>
          <Text size="xs" c="dimmed">
            Name the milestone; add its skills from the stage list.
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
          <TextInput
            label="Classes assigned to this stage"
            type="number"
            size="sm"
            w={210}
            value={draft.classesCount}
            onChange={set('classesCount')}
            error={errors.classesCount}
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
