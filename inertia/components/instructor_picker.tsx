import { NativeSelect, SimpleGrid, Stack, Text, TextInput } from '@mantine/core'
import type { Data } from '@generated/data'

export type InstructorMode = 'none' | 'existing' | 'invite'

type Props = {
  mode: InstructorMode
  onModeChange: (mode: InstructorMode) => void
  instructorOptions: Data.Membership[]
  errors: Record<string, string>
  initialMembershipId?: number
  initialInvite?: {
    name?: string
    phone?: string
    email?: string
  }
}

export default function InstructorPicker({
  mode,
  onModeChange,
  instructorOptions,
  errors,
  initialMembershipId,
  initialInvite,
}: Props) {
  return (
    <Stack gap="sm">
      <input type="hidden" name="instructorMode" value={mode} />
      <NativeSelect
        label="Instructor"
        value={mode}
        onChange={(event) => onModeChange(event.currentTarget.value as InstructorMode)}
        data={[
          { value: 'none', label: 'No instructor yet' },
          { value: 'existing', label: 'Choose an existing instructor' },
          { value: 'invite', label: 'Invite a pending Teacher' },
        ]}
      />

      {mode === 'none' ? null : mode === 'existing' ? (
        <NativeSelect
          label="Existing instructor"
          name="instructorMembershipId"
          defaultValue={initialMembershipId ? String(initialMembershipId) : ''}
          data={[
            { value: '', label: 'Choose an instructor' },
            ...instructorOptions.map((membership) => ({
              value: String(membership.id),
              label: `${membership.label} — ${membership.roles.join(', ')}`,
            })),
          ]}
          error={errors.instructorMembershipId}
        />
      ) : (
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            The class can be saved while the Teacher invitation is pending.
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Teacher name"
              name="inviteTeacherName"
              defaultValue={initialInvite?.name}
              error={errors.inviteTeacherName}
            />
            <TextInput
              label="Teacher phone"
              name="inviteTeacherPhone"
              defaultValue={initialInvite?.phone}
              error={errors.inviteTeacherPhone}
            />
          </SimpleGrid>
          <TextInput
            label="Teacher email"
            name="inviteTeacherEmail"
            type="email"
            defaultValue={initialInvite?.email}
            error={errors.inviteTeacherEmail}
          />
        </Stack>
      )}
    </Stack>
  )
}
