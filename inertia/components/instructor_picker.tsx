import { useState } from 'react'
import { Button, MultiSelect, SimpleGrid, Stack, TagsInput, Text, TextInput } from '@mantine/core'
import { IconPlus, IconX } from '@tabler/icons-react'
import type { Data } from '@generated/data'

// Selected instructors are encoded as "m-<membershipId>" | "i-<invitationId>"
// so accepted members and pending invitees share one MultiSelect.
const MEMBERSHIP_PREFIX = 'm-'
const INVITATION_PREFIX = 'i-'

export function membershipKey(id: number): string {
  return `${MEMBERSHIP_PREFIX}${id}`
}

export function invitationKey(id: number): string {
  return `${INVITATION_PREFIX}${id}`
}

function memberOptionLabel(membership: Data.Membership): string {
  const name = membership.user?.fullName?.trim()
  const email = membership.user?.email
  return [name, email].filter(Boolean).join(' · ') || membership.label
}

function inviteeOptionLabel(invitation: Data.Invitation): string {
  return [invitation.fullName, invitation.email].filter(Boolean).join(' · ')
}

export default function InstructorPicker({
  instructorOptions,
  pendingInstructorOptions,
  initialSelection = [],
  errors,
}: {
  instructorOptions: Data.Membership[]
  pendingInstructorOptions: Data.Invitation[]
  initialSelection?: string[]
  errors: Record<string, string>
}) {
  const [selected, setSelected] = useState<string[]>(initialSelection)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [certifications, setCertifications] = useState<string[]>([])

  const membershipIds = selected
    .filter((key) => key.startsWith(MEMBERSHIP_PREFIX))
    .map((key) => key.slice(MEMBERSHIP_PREFIX.length))
  const invitationIds = selected
    .filter((key) => key.startsWith(INVITATION_PREFIX))
    .map((key) => key.slice(INVITATION_PREFIX.length))

  // A selected pending invitee may not appear in the options (e.g. it expired
  // since); keep it selectable so editing does not silently drop it.
  const optionKeys = new Set([
    ...instructorOptions.map((membership) => membershipKey(membership.id)),
    ...pendingInstructorOptions.map((invitation) => invitationKey(invitation.id)),
  ])
  const orphanInvitations = selected.filter((key) => !optionKeys.has(key))

  return (
    <Stack gap="sm">
      {membershipIds.map((id, index) => (
        <input key={`m${id}`} type="hidden" name={`instructorMembershipIds[${index}]`} value={id} />
      ))}
      {invitationIds.map((id, index) => (
        <input key={`i${id}`} type="hidden" name={`instructorInvitationIds[${index}]`} value={id} />
      ))}

      <MultiSelect
        label="Instructors"
        description="Teachers and Head Coaches — including invitees who have not accepted yet."
        placeholder={selected.length === 0 ? 'No instructors assigned' : undefined}
        value={selected}
        onChange={setSelected}
        error={errors.instructorMembershipIds ?? errors.instructorInvitationIds}
        data={[
          {
            group: 'Members',
            items: instructorOptions.map((membership) => ({
              value: membershipKey(membership.id),
              label: memberOptionLabel(membership),
            })),
          },
          {
            group: 'Invited (pending)',
            items: pendingInstructorOptions.map((invitation) => ({
              value: invitationKey(invitation.id),
              label: inviteeOptionLabel(invitation),
            })),
          },
          ...(orphanInvitations.length > 0
            ? [
                {
                  group: 'Currently assigned',
                  items: orphanInvitations.map((key) => ({ value: key, label: 'Pending invitee' })),
                },
              ]
            : []),
        ]}
      />

      {inviteOpen ? (
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            The class can be saved while the Teacher invitation is pending; they join the
            instructors above once invited.
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="First name"
              name="inviteTeacherFirstName"
              error={errors.inviteTeacherFirstName}
            />
            <TextInput
              label="Last name"
              name="inviteTeacherLastName"
              error={errors.inviteTeacherLastName}
            />
            <TextInput
              label="Phone number"
              name="inviteTeacherPhone"
              error={errors.inviteTeacherPhone}
            />
            <TextInput
              label="Email"
              name="inviteTeacherEmail"
              type="email"
              error={errors.inviteTeacherEmail}
            />
          </SimpleGrid>
          <TagsInput
            label="Certifications"
            description="Type a certification and press Enter to add more than one."
            value={certifications}
            onChange={setCertifications}
            error={errors.inviteTeacherCertifications}
          />
          {certifications.map((certification, index) => (
            <input
              key={certification}
              type="hidden"
              name={`inviteTeacherCertifications[${index}]`}
              value={certification}
            />
          ))}
          <div>
            <Button
              type="button"
              variant="subtle"
              size="xs"
              leftSection={<IconX size={14} />}
              onClick={() => {
                setInviteOpen(false)
                setCertifications([])
              }}
            >
              Cancel invitation
            </Button>
          </div>
        </Stack>
      ) : (
        <div>
          <Button
            type="button"
            variant="subtle"
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={() => setInviteOpen(true)}
          >
            Invite a new teacher
          </Button>
        </div>
      )}
    </Stack>
  )
}
