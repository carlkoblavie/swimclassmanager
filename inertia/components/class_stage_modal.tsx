import { useState } from 'react'
import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core'
import type { Data } from '@generated/data'
import SkillPicker, { type NewSkillDraft } from '~/components/skill_picker'

export type ClassStageDraft = {
  id?: number
  name: string
  position: number
  skillIds: number[]
  newSkills: NewSkillDraft[]
}

type Props = {
  opened: boolean
  onClose: () => void
  onSave: (draft: ClassStageDraft) => void
  skillOptions: Data.Skill[]
  initial?: ClassStageDraft
  nextPosition: number
}

function emptyDraft(position: number): ClassStageDraft {
  return { name: '', position, skillIds: [], newSkills: [] }
}

export default function ClassStageModal({
  opened,
  onClose,
  onSave,
  skillOptions,
  initial,
  nextPosition,
}: Props) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={initial ? 'Edit stage' : 'Add stage'}
      size="lg"
      centered
    >
      {opened && (
        <ClassStageForm
          key={initial ? `edit-${initial.position}-${initial.name}` : `new-${nextPosition}`}
          onClose={onClose}
          onSave={onSave}
          skillOptions={skillOptions}
          initial={initial}
          nextPosition={nextPosition}
        />
      )}
    </Modal>
  )
}

type FormProps = {
  onClose: () => void
  onSave: (draft: ClassStageDraft) => void
  skillOptions: Data.Skill[]
  initial?: ClassStageDraft
  nextPosition: number
}

function ClassStageForm({ onClose, onSave, skillOptions, initial, nextPosition }: FormProps) {
  const [draft, setDraft] = useState<ClassStageDraft>(initial ?? emptyDraft(nextPosition))
  const [errors, setErrors] = useState<{ name?: string; skills?: string }>({})

  const toggleSkill = (skillId: number) => {
    setDraft((current) => ({
      ...current,
      skillIds: current.skillIds.includes(skillId)
        ? current.skillIds.filter((id) => id !== skillId)
        : [...current.skillIds, skillId],
    }))
  }

  const addNewSkill = () => {
    setDraft((current) => ({
      ...current,
      newSkills: [...current.newSkills, { name: '', description: '' }],
    }))
  }

  const updateNewSkill = (index: number, field: keyof NewSkillDraft, value: string) => {
    setDraft((current) => ({
      ...current,
      newSkills: current.newSkills.map((skill, i) =>
        i === index ? { ...skill, [field]: value } : skill
      ),
    }))
  }

  const removeNewSkill = (index: number) => {
    setDraft((current) => ({
      ...current,
      newSkills: current.newSkills.filter((_, i) => i !== index),
    }))
  }

  const submit = () => {
    const nextErrors: { name?: string; skills?: string } = {}
    const hasNamedNewSkill = draft.newSkills.some((skill) => skill.name.trim())

    if (!draft.name.trim()) nextErrors.name = 'This field is required'
    if (draft.skillIds.length === 0 && !hasNamedNewSkill) {
      nextErrors.skills = 'Add at least one skill.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    onSave({
      ...draft,
      name: draft.name.trim(),
      newSkills: draft.newSkills.filter((skill) => skill.name.trim()),
    })
    onClose()
  }

  return (
    <Stack gap="md">
      <TextInput
        label="Stage name"
        value={draft.name}
        onChange={(event) => {
          const value = event.currentTarget.value
          setDraft((current) => ({ ...current, name: value }))
        }}
        error={errors.name}
      />
      <TextInput
        label="Order"
        type="number"
        value={String(draft.position)}
        onChange={(event) => {
          const value = event.currentTarget.value
          setDraft((current) => ({
            ...current,
            position: Number(value) || 1,
          }))
        }}
      />

      <SkillPicker
        skillOptions={skillOptions}
        selectedSkillIds={draft.skillIds}
        newSkills={draft.newSkills}
        onToggleSkill={toggleSkill}
        onAddNewSkill={addNewSkill}
        onUpdateNewSkill={updateNewSkill}
        onRemoveNewSkill={removeNewSkill}
      />
      {errors.skills && (
        <Text c="red" size="sm">
          {errors.skills}
        </Text>
      )}

      <Group justify="flex-end">
        <Button type="button" variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={submit}>
          Save stage
        </Button>
      </Group>
    </Stack>
  )
}
