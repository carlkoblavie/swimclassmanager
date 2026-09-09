import { useEffect, useMemo, useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import { Avatar, Box, Button, Checkbox, Group, Modal, Select, Stack, Text } from '@mantine/core'
import type { Data } from '@generated/data'

type Membership = Data.Membership
type Invitation = Data.Invitation

// One lead + assistants, matching ClassInstructorRole (LEAD = 1).
type StageInstructor = { type: 'membership' | 'invitation'; id: number; role: number }

const MEMBERSHIP_PREFIX = 'm-'
const INVITATION_PREFIX = 'i-'
const LEAD_ROLE = 1

function membershipKey(id: number) {
  return `${MEMBERSHIP_PREFIX}${id}`
}
function invitationKey(id: number) {
  return `${INVITATION_PREFIX}${id}`
}

function initials(label: string) {
  const parts = label.split(/\s+/).filter(Boolean).slice(0, 2)
  return parts.map((part) => part[0]).join('').toUpperCase() || '?'
}

function memberLabel(member: Membership) {
  return member.user?.fullName?.trim() || member.user?.email || member.label
}
function inviteeLabel(invitation: Invitation) {
  return invitation.fullName || invitation.email || invitation.label
}

/**
 * Assign a school's instructors to a curriculum stage: one lead and any number
 * of assistants. Every class and lesson in the stage follows this staffing.
 */
export default function StageInstructorsModal({
  opened,
  stageId,
  stageName,
  current,
  instructorOptions,
  pendingInstructorOptions,
  onClose,
}: {
  opened: boolean
  stageId: number
  stageName: string
  current: StageInstructor[]
  instructorOptions: Membership[]
  pendingInstructorOptions: Invitation[]
  onClose: () => void
}) {
  const keyFor = (instructor: StageInstructor) =>
    instructor.type === 'membership' ? membershipKey(instructor.id) : invitationKey(instructor.id)

  const [lead, setLead] = useState<string | null>(null)
  const [assistants, setAssistants] = useState<string[]>([])

  useEffect(() => {
    const leadInstructor = current.find((instructor) => instructor.role === LEAD_ROLE)
    setLead(leadInstructor ? keyFor(leadInstructor) : null)
    setAssistants(
      current.filter((instructor) => instructor.role !== LEAD_ROLE).map(keyFor)
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageId, opened])

  const leadOptions = useMemo(
    () => [
      ...instructorOptions.map((member) => ({
        value: membershipKey(member.id),
        label: memberLabel(member),
      })),
      ...pendingInstructorOptions.map((invitation) => ({
        value: invitationKey(invitation.id),
        label: `${inviteeLabel(invitation)} · invited`,
      })),
    ],
    [instructorOptions, pendingInstructorOptions]
  )

  const assistantOptions = [
    ...instructorOptions.map((member) => ({
      key: membershipKey(member.id),
      label: memberLabel(member),
    })),
    ...pendingInstructorOptions.map((invitation) => ({
      key: invitationKey(invitation.id),
      label: `${inviteeLabel(invitation)} · invited`,
    })),
  ].filter((option) => option.key !== lead)

  return (
    <Modal opened={opened} onClose={onClose} title={`Instructors · ${stageName}`} size="lg" centered>
      <Form route="stages.assign_instructors" onSuccess={onClose}>
        {({ processing }) => (
          <Stack gap="lg">
            <Text size="sm" c="dimmed">
              Set the lead instructor and any assistants for this stage. Every class and lesson in
              the stage uses this staffing.
            </Text>

            <input type="hidden" name="levelStageId" value={stageId} />

            <Box>
              <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.14em" mb="xs">
                Lead instructor
              </Text>
              <Select
                searchable
                clearable
                placeholder="No lead instructor"
                value={lead}
                onChange={(value) => {
                  setLead(value)
                  if (value) {
                    setAssistants((current) => current.filter((key) => key !== value))
                  }
                }}
                data={leadOptions}
              />
            </Box>

            <Box>
              <Group justify="space-between" align="baseline">
                <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.14em">
                  Assistants
                </Text>
                <Text size="sm" c="dimmed">
                  {assistants.length || 'none'}
                </Text>
              </Group>
              <Stack gap="xs" mt="xs">
                {assistantOptions.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    No other instructors available.
                  </Text>
                ) : (
                  assistantOptions.map((option) => {
                    const checked = assistants.includes(option.key)
                    return (
                      <Box
                        key={option.key}
                        p="sm"
                        style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 10 }}
                      >
                        <Checkbox
                          checked={checked}
                          onChange={() =>
                            setAssistants((current) =>
                              checked
                                ? current.filter((key) => key !== option.key)
                                : [...current, option.key]
                            )
                          }
                          label={
                            <Group gap="sm" wrap="nowrap">
                              <Avatar size="sm" radius="xl" color="aqua">
                                {initials(option.label)}
                              </Avatar>
                              <Text>{option.label}</Text>
                            </Group>
                          }
                        />
                      </Box>
                    )
                  })
                )}
              </Stack>
            </Box>

            {lead?.startsWith(MEMBERSHIP_PREFIX) && (
              <input
                type="hidden"
                name="leadInstructorMembershipId"
                value={lead.slice(MEMBERSHIP_PREFIX.length)}
              />
            )}
            {lead?.startsWith(INVITATION_PREFIX) && (
              <input
                type="hidden"
                name="leadInstructorInvitationId"
                value={lead.slice(INVITATION_PREFIX.length)}
              />
            )}
            {assistants
              .filter((key) => key.startsWith(MEMBERSHIP_PREFIX))
              .map((key, index) => (
                <input
                  key={key}
                  type="hidden"
                  name={`supportingInstructorMembershipIds[${index}]`}
                  value={key.slice(MEMBERSHIP_PREFIX.length)}
                />
              ))}
            {assistants
              .filter((key) => key.startsWith(INVITATION_PREFIX))
              .map((key, index) => (
                <input
                  key={key}
                  type="hidden"
                  name={`supportingInstructorInvitationIds[${index}]`}
                  value={key.slice(INVITATION_PREFIX.length)}
                />
              ))}

            <Group justify="flex-end">
              <Button type="button" variant="default" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={processing}>
                Save instructors
              </Button>
            </Group>
          </Stack>
        )}
      </Form>
    </Modal>
  )
}
