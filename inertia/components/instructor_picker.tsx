import { useState } from 'react'
import {
  Button,
  MultiSelect,
  Select,
  SimpleGrid,
  Stack,
  TagsInput,
  Text,
  TextInput,
} from '@mantine/core'
import { IconPlus, IconX } from '@tabler/icons-react'
import type { Data } from '@generated/data'

// Selected instructors are encoded as "m-<membershipId>" | "i-<invitationId>"
// so accepted members and pending invitees share one picker option list.
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
  initialLead = null,
  initialSupporting = [],
  initialSelection,
  errors,
}: {
  instructorOptions: Data.Membership[]
  pendingInstructorOptions: Data.Invitation[]
  initialLead?: string | null
  initialSupporting?: string[]
  initialSelection?: string[]
  errors: Record<string, string>
}) {
  const legacySelection = initialSelection ?? []
  const [lead, setLead] = useState<string | null>(initialLead ?? legacySelection[0] ?? null)
  const [supporting, setSupporting] = useState<string[]>(
    initialSupporting.length > 0 ? initialSupporting : legacySelection.slice(1)
  )
  const [inviteOpen, setInviteOpen] = useState(false)
  const [certifications, setCertifications] = useState<string[]>([])

  const leadMembershipId = lead?.startsWith(MEMBERSHIP_PREFIX)
    ? lead.slice(MEMBERSHIP_PREFIX.length)
    : null
  const leadInvitationId = lead?.startsWith(INVITATION_PREFIX)
    ? lead.slice(INVITATION_PREFIX.length)
    : null
  const supportingMembershipIds = supporting
    .filter((key) => key.startsWith(MEMBERSHIP_PREFIX))
    .map((key) => key.slice(MEMBERSHIP_PREFIX.length))
  const supportingInvitationIds = supporting
    .filter((key) => key.startsWith(INVITATION_PREFIX))
    .map((key) => key.slice(INVITATION_PREFIX.length))

  // A selected pending invitee may not appear in the options (e.g. it expired
  // since); keep it selectable so editing does not silently drop it.
  const optionKeys = new Set([
    ...instructorOptions.map((membership) => membershipKey(membership.id)),
    ...pendingInstructorOptions.map((invitation) => invitationKey(invitation.id)),
  ])
  const selectedKeys = [lead, ...supporting].filter((key): key is string => Boolean(key))
  const orphanKeys = selectedKeys.filter((key) => !optionKeys.has(key))
  const options = [
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
    ...(orphanKeys.length > 0
      ? [
          {
            group: 'Currently assigned',
            items: orphanKeys.map((key) => ({ value: key, label: 'Assigned instructor' })),
          },
        ]
      : []),
  ]
  const supportingOptions = options.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.value !== lead),
  }))

  return (
    <Stack gap="sm">
      {leadMembershipId && (
        <input type="hidden" name="leadInstructorMembershipId" value={leadMembershipId} />
      )}
      {leadInvitationId && (
        <input type="hidden" name="leadInstructorInvitationId" value={leadInvitationId} />
      )}
      {supportingMembershipIds.map((id, index) => (
        <input
          key={`m${id}`}
          type="hidden"
          name={`supportingInstructorMembershipIds[${index}]`}
          value={id}
        />
      ))}
      {supportingInvitationIds.map((id, index) => (
        <input
          key={`i${id}`}
          type="hidden"
          name={`supportingInstructorInvitationIds[${index}]`}
          value={id}
        />
      ))}

      <Select
        label="Lead instructor"
        description="Teachers and Head Coaches — including invitees who have not accepted yet."
        placeholder="No lead assigned"
        value={lead}
        onChange={(value) => {
          setLead(value)
          setSupporting((current) => current.filter((key) => key !== value))
        }}
        error={errors.leadInstructorMembershipId ?? errors.leadInstructorInvitationId}
        data={options}
        clearable
      />

      <MultiSelect
        label="Supporting instructors"
        description="Additional teachers who help with the class."
        placeholder={supporting.length === 0 ? 'No supporting instructors assigned' : undefined}
        value={supporting}
        onChange={setSupporting}
        error={errors.supportingInstructorMembershipIds ?? errors.supportingInstructorInvitationIds}
        data={supportingOptions}
      />

      {inviteOpen ? (
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            The class can be saved while the Teacher invitation is pending; they join the supporting
            instructors once invited.
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
