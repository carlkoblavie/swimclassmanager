import { Fragment, useState } from 'react'
import { useDisclosure } from '@mantine/hooks'
import {
  Anchor,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import LevelModal, { type LevelDraft } from '~/components/level_modal'

type Props = {
  errors: Record<string, string>
  processing: boolean
  submitLabel: string
  initial?: { name: string; description: string; levels: LevelDraft[] }
}

export default function ProgramFormBody({ errors, processing, submitLabel, initial }: Props) {
  const [levels, setLevels] = useState<LevelDraft[]>(initial?.levels ?? [])
  const [opened, { open, close }] = useDisclosure(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const openAdd = () => {
    setEditingIndex(null)
    open()
  }
  const openEdit = (index: number) => {
    setEditingIndex(index)
    open()
  }
  const remove = (index: number) => setLevels((current) => current.filter((_, i) => i !== index))
  const save = (draft: LevelDraft) =>
    setLevels((current) =>
      editingIndex === null
        ? [...current, draft]
        : current.map((level, i) => (i === editingIndex ? draft : level))
    )

  return (
    <>
      <Stack gap="lg">
        <TextInput
          label="Program name"
          name="name"
          defaultValue={initial?.name}
          error={errors.name}
        />
        <Textarea
          label="Description"
          name="description"
          defaultValue={initial?.description}
          error={errors.description}
          autosize
          minRows={2}
        />

        <Divider />

        <Group justify="space-between">
          <Title order={3}>Levels</Title>
          <Button variant="light" size="sm" onClick={openAdd}>
            Add level
          </Button>
        </Group>

        {levels.length === 0 ? (
          <Text c="dimmed" size="sm">
            No levels added yet. Add at least one.
          </Text>
        ) : (
          levels.map((level, index) => (
            <Card key={index} withBorder padding="sm" radius="md">
              <Group justify="space-between">
                <Text fw={500}>
                  {level.name} — {level.ageGroup} — GHS {level.defaultFee}
                </Text>
                <Group gap="md">
                  <Anchor
                    component="button"
                    type="button"
                    size="sm"
                    onClick={() => openEdit(index)}
                  >
                    Edit
                  </Anchor>
                  <Anchor
                    component="button"
                    type="button"
                    size="sm"
                    c="red"
                    onClick={() => remove(index)}
                  >
                    Remove
                  </Anchor>
                </Group>
              </Group>
            </Card>
          ))
        )}

        {errors.levels && (
          <Text c="red" size="sm">
            {errors.levels}
          </Text>
        )}

        {levels.map((level, index) => (
          <Fragment key={index}>
            {level.id !== undefined && (
              <input type="hidden" name={`levels[${index}][id]`} value={level.id} />
            )}
            <input type="hidden" name={`levels[${index}][name]`} value={level.name} />
            <input type="hidden" name={`levels[${index}][ageGroup]`} value={level.ageGroup} />
            <input type="hidden" name={`levels[${index}][description]`} value={level.description} />
            <input type="hidden" name={`levels[${index}][defaultFee]`} value={level.defaultFee} />
            <input type="hidden" name={`levels[${index}][capacity]`} value={level.capacity} />
          </Fragment>
        ))}

        <Button type="submit" size="md" loading={processing} disabled={levels.length === 0}>
          {submitLabel}
        </Button>
      </Stack>

      <LevelModal
        opened={opened}
        onClose={close}
        onSave={save}
        initial={editingIndex !== null ? levels[editingIndex] : undefined}
      />
    </>
  )
}
