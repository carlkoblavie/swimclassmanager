import { type ChangeEvent, useState } from 'react'
import {
  Button,
  Group,
  Modal,
  NativeSelect,
  SimpleGrid,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core'

export type LearnerDraft = {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  relation: string
  nationality: string
  residentialLocation: string
  medicalInfo: string
  swimmingExperience: string
}

const RELATIONS = [
  { value: '', label: 'Select relationship' },
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'self', label: 'Self (I am the learner)' },
]

type Props = {
  opened: boolean
  onClose: () => void
  onSave: (draft: LearnerDraft) => void
  initial?: LearnerDraft
  genders: string[]
}

const REQUIRED: (keyof LearnerDraft)[] = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'gender',
  'relation',
  'nationality',
  'residentialLocation',
  'medicalInfo',
]

function emptyDraft(genders: string[]): LearnerDraft {
  return {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: genders[0] ?? '',
    relation: '',
    nationality: '',
    residentialLocation: '',
    medicalInfo: '',
    swimmingExperience: '',
  }
}

export default function LearnerModal({ opened, onClose, onSave, initial, genders }: Props) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={initial ? 'Edit learner' : 'Add learner'}
      size="lg"
      centered
    >
      {/* Remounted on each open, so its state initializes fresh from `initial`. */}
      <LearnerForm
        initial={initial}
        genders={genders}
        submitLabel={initial ? 'Save changes' : 'Add learner'}
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
  initial?: LearnerDraft
  genders: string[]
  submitLabel: string
  onCancel: () => void
  onSubmit: (draft: LearnerDraft) => void
}

function LearnerForm({ initial, genders, submitLabel, onCancel, onSubmit }: FormProps) {
  const [draft, setDraft] = useState<LearnerDraft>(initial ?? emptyDraft(genders))
  const [errors, setErrors] = useState<Partial<Record<keyof LearnerDraft, string>>>({})

  const set =
    (field: keyof LearnerDraft) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.currentTarget.value
      setDraft((current) => ({ ...current, [field]: value }))
    }

  const submit = () => {
    const next: Partial<Record<keyof LearnerDraft, string>> = {}
    for (const field of REQUIRED) {
      if (!draft[field].trim()) next[field] = 'This field is required'
    }
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }
    onSubmit(draft)
  }

  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput
          label="First name"
          value={draft.firstName}
          onChange={set('firstName')}
          error={errors.firstName}
        />
        <TextInput
          label="Last name"
          value={draft.lastName}
          onChange={set('lastName')}
          error={errors.lastName}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput
          label="Date of birth"
          type="date"
          value={draft.dateOfBirth}
          onChange={set('dateOfBirth')}
          error={errors.dateOfBirth}
        />
        <NativeSelect
          label="Gender"
          data={genders}
          value={draft.gender}
          onChange={set('gender')}
          error={errors.gender}
        />
      </SimpleGrid>

      <NativeSelect
        label="Relationship to registrant"
        description="How the person registering relates to this learner"
        data={RELATIONS}
        value={draft.relation}
        onChange={set('relation')}
        error={errors.relation}
      />

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput
          label="Nationality"
          value={draft.nationality}
          onChange={set('nationality')}
          error={errors.nationality}
        />
        <TextInput
          label="Residential location"
          value={draft.residentialLocation}
          onChange={set('residentialLocation')}
          error={errors.residentialLocation}
        />
      </SimpleGrid>

      <Textarea
        label="Medical information"
        description='Enter "None" if there is nothing to report'
        value={draft.medicalInfo}
        onChange={set('medicalInfo')}
        error={errors.medicalInfo}
        autosize
        minRows={2}
      />

      <Textarea
        label="Swimming experience"
        description="Optional"
        value={draft.swimmingExperience}
        onChange={set('swimmingExperience')}
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
