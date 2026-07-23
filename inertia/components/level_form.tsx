import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { Button, Card, Group, NativeSelect, Stack, Textarea, TextInput, Title } from '@mantine/core'
import type { StageDraft } from '~/components/stage_builder'

// Age range selects: bounded ranges read "2–6 yrs", open-ended ones "2yrs+".
const AGE_OPTIONS = Array.from({ length: 18 }, (_, index) => String(index + 1))
const NO_MAX = 'plus'

function parseAgeGroup(value: string): { from: string; to: string } {
  const numbers = value.match(/\d+/g) ?? []
  const from = numbers[0] ?? ''
  const to = value.includes('+') ? NO_MAX : (numbers[1] ?? '')
  return { from, to }
}

function formatAgeGroup(from: string, to: string): string {
  if (!from || !to) {
    return ''
  }
  return to === NO_MAX ? `${from}yrs+` : `${from}–${to} yrs`
}

export type LevelDraft = {
  id?: number
  code?: string
  name: string
  ageGroup: string
  description: string
  defaultFee: string // cedis, as entered
  classesCount: string // sessions to complete the level; stages inherit it
  audience: string // 'child' | 'adult' — selects the public signup form
  stages: StageDraft[]
}

type LevelField = 'name' | 'ageGroup' | 'description' | 'defaultFee' | 'classesCount' | 'audience'

const REQUIRED: LevelField[] = ['name', 'ageGroup', 'description', 'defaultFee', 'classesCount']

function emptyDraft(): LevelDraft {
  return {
    name: '',
    ageGroup: '',
    description: '',
    defaultFee: '',
    classesCount: '',
    audience: 'child',
    stages: [],
  }
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

  const initialAges = parseAgeGroup(initial?.ageGroup ?? '')
  const [ageFrom, setAgeFrom] = useState(initialAges.from)
  const [ageTo, setAgeTo] = useState(initialAges.to)

  const changeAges = (from: string, to: string) => {
    // Reset an upper bound that no longer fits the new lower bound.
    const nextTo = to !== NO_MAX && to !== '' && Number(to) <= Number(from) ? '' : to
    setAgeFrom(from)
    setAgeTo(nextTo)
    setDraft((current) => ({ ...current, ageGroup: formatAgeGroup(from, nextTo) }))
  }

  // Bring the form into view when it opens, clearing the fixed app header.
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

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
    <Card ref={rootRef} bg="gray.0" shadow="none" style={{ scrollMarginTop: 76 }}>
      <Stack gap="md">
        <Title order={3} fz="lg">
          {initial ? 'Edit level' : 'Add level'}
        </Title>
        <Group gap="md" align="flex-start">
          <TextInput
            label="Level name"
            flex={2}
            value={draft.name}
            onChange={set('name')}
            error={errors.name}
          />
          <TextInput
            label="Lessons required to complete this Level"
            type="number"
            flex={1}
            value={draft.classesCount}
            onChange={set('classesCount')}
            error={errors.classesCount}
          />
        </Group>
        <Group gap="md" align="flex-start">
          <NativeSelect
            label="From age"
            flex={1}
            value={ageFrom}
            onChange={(event) => changeAges(event.currentTarget.value, ageTo)}
            error={errors.ageGroup}
            data={[
              { value: '', label: 'Select age' },
              ...AGE_OPTIONS.map((age) => ({ value: age, label: `${age} yrs` })),
            ]}
          />
          <NativeSelect
            label="To age"
            flex={1}
            value={ageTo}
            onChange={(event) => changeAges(ageFrom, event.currentTarget.value)}
            data={[
              { value: '', label: 'Select max age' },
              { value: NO_MAX, label: `No max (${ageFrom || '…'}yrs+)` },
              ...AGE_OPTIONS.filter((age) => Number(age) > Number(ageFrom || 0)).map((age) => ({
                value: age,
                label: `${age} yrs`,
              })),
            ]}
          />
          <TextInput
            label="Fee (GHS)"
            type="number"
            flex={1}
            value={draft.defaultFee}
            onChange={set('defaultFee')}
            error={errors.defaultFee}
          />
          <NativeSelect
            label="Audience"
            flex={1}
            value={draft.audience}
            onChange={(event) => {
              const value = event.currentTarget.value
              setDraft((current) => ({ ...current, audience: value }))
            }}
            data={[
              { value: 'child', label: 'Children' },
              { value: 'adult', label: 'Adults' },
            ]}
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
