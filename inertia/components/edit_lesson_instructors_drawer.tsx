import { useEffect, useMemo, useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import type { Data } from '@generated/data'

type Lesson = Data.SwimmingClass['lessons'][number]
type Membership = Data.Membership
type Invitation = Data.Invitation

const MEMBERSHIP_PREFIX = 'm-'
const INVITATION_PREFIX = 'i-'

function membershipKey(id: number) {
  return `${MEMBERSHIP_PREFIX}${id}`
}

function invitationKey(id: number) {
  return `${INVITATION_PREFIX}${id}`
}

function instructorInitials(label: string) {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
  return initials.toUpperCase() || '?'
}

function memberLabel(member: Membership) {
  return member.user?.fullName?.trim() || member.user?.email || member.label
}

function inviteeLabel(invitation: Invitation) {
  return invitation.fullName || invitation.email || invitation.label
}

export default function EditLessonInstructorsDrawer({
  lesson,
  lessonNumber,
  className,
  classAssessmentGoals,
  classSkills,
  classStartTime,
  opened,
  instructorOptions,
  pendingInstructorOptions,
  onClose,
  onSaved,
}: {
  lesson: Lesson | null
  lessonNumber: number
  className: string
  classAssessmentGoals: string[]
  classSkills: Data.SwimmingClass['skills']
  classStartTime: string | null
  opened: boolean
  instructorOptions: Membership[]
  pendingInstructorOptions: Invitation[]
  onClose: () => void
  onSaved?: (lessonId: number) => void
}) {
  const [lead, setLead] = useState<string | null>(null)
  const [supporting, setSupporting] = useState<string[]>([])
  const [objectives, setObjectives] = useState<string[]>([])
  const [skillIds, setSkillIds] = useState<number[]>([])

  useEffect(() => {
    if (!lesson) {
      setLead(null)
      setSupporting([])
      setObjectives([])
      setSkillIds([])
      return
    }

    const keyForInstructor = (instructor: Lesson['instructors'][number]) =>
      instructor.type === 'membership' ? membershipKey(instructor.id) : invitationKey(instructor.id)
    setLead(lesson.leadInstructor ? keyForInstructor(lesson.leadInstructor) : null)
    setSupporting(lesson.supportingInstructors.map(keyForInstructor))
    // Pre-select goals already saved on the lesson (stored as newline-joined objectives)
    const savedGoals = (lesson.objectives ?? '')
      .split('\n')
      .map((goal) => goal.trim())
      .filter(Boolean)
    setObjectives(savedGoals.filter((goal) => classAssessmentGoals.includes(goal)))
    // Pre-select skills already saved on the lesson, falling back to all class skills
    const savedSkillIds = lesson.skillIds ?? []
    setSkillIds(
      savedSkillIds.length > 0
        ? savedSkillIds
        : classSkills.map((skill) => skill.id)
    )
    // Only reset when switching to a different lesson — not when the array
    // references change on re-render (which would wipe in-progress selections).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id])

  const options = useMemo(
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

  const supportingOptions = [
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
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={520}
      padding={0}
      withCloseButton={false}
      title={null}
    >
      {lesson && (
        <Form
          route="class_lessons.assign_instructors"
          routeParams={{ id: lesson.id }}
          onSuccess={() => (onSaved ? onSaved(lesson.id) : onClose())}
        >
          {({ processing }) => (
            <Stack gap={0} mih="100%">
              <Group justify="space-between" align="flex-start" p="lg">
                <Box>
                  <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.14em">
                    Edit lesson {String(lessonNumber).padStart(2, '0')}
                  </Text>
                  <Title order={2} mt={4}>
                    {lesson.date.formatted}
                  </Title>
                  <Text c="dimmed" mt={2}>
                    {className}
                  </Text>
                </Box>
                <ActionIcon variant="subtle" color="gray" aria-label="Close" onClick={onClose}>
                  <IconX size={20} />
                </ActionIcon>
              </Group>

              <Divider />

              <Stack gap="lg" p="lg" style={{ flex: 1 }}>
                <Box>
                  <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.14em">
                    Schedule
                  </Text>
                  <SimpleGrid cols={{ base: 1, sm: 3 }} mt="xs">
                    <TextInput
                      label="Date"
                      name="date"
                      type="date"
                      defaultValue={lesson.date.raw}
                      required
                    />
                    <Box>
                      <Text size="sm" fw={500}>
                        Start time
                      </Text>
                      <Text mt={8}>{classStartTime ?? 'Not set'}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" fw={500}>
                        Duration
                      </Text>
                      <Text mt={8}>{lesson.durationMinutes} min</Text>
                    </Box>
                  </SimpleGrid>
                </Box>

                <Box>
                  <Group justify="space-between" align="baseline">
                    <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.14em">
                      Objectives
                    </Text>
                    <Text size="sm" c={objectives.length === 0 ? 'red' : 'dimmed'}>
                      {objectives.length || 'pick at least one'}
                    </Text>
                  </Group>
                  <Text size="sm" c="dimmed" mt={4}>
                    Choose the class goals this lesson works toward.
                  </Text>
                  <Stack gap="xs" mt="xs">
                    {classAssessmentGoals.length === 0 ? (
                      <Text size="sm" c="dimmed">
                        This class has no assessment goals yet.
                      </Text>
                    ) : (
                      classAssessmentGoals.map((goal) => {
                        const checked = objectives.includes(goal)
                        return (
                          <Box
                            key={goal}
                            p="sm"
                            style={{
                              border: '1px solid var(--mantine-color-gray-3)',
                              borderRadius: 10,
                            }}
                          >
                            <Checkbox
                              checked={checked}
                              onChange={() =>
                                setObjectives((current) =>
                                  checked
                                    ? current.filter((item) => item !== goal)
                                    : [...current, goal]
                                )
                              }
                              label={<Text>{goal}</Text>}
                            />
                          </Box>
                        )
                      })
                    )}
                  </Stack>
                </Box>

                <Box>
                  <Group justify="space-between" align="baseline">
                    <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.14em">
                      Skills
                    </Text>
                    <Text size="sm" c={skillIds.length === 0 ? 'red' : 'dimmed'}>
                      {skillIds.length || 'pick at least one'}
                    </Text>
                  </Group>
                  <Text size="sm" c="dimmed" mt={4}>
                    Choose the class skills this lesson covers.
                  </Text>
                  <Stack gap="xs" mt="xs">
                    {classSkills.length === 0 ? (
                      <Text size="sm" c="dimmed">
                        This class has no skills yet.
                      </Text>
                    ) : (
                      classSkills.map((skill) => {
                        const checked = skillIds.includes(skill.id)
                        return (
                          <Box
                            key={skill.id}
                            p="sm"
                            style={{
                              border: '1px solid var(--mantine-color-gray-3)',
                              borderRadius: 10,
                            }}
                          >
                            <Checkbox
                              checked={checked}
                              onChange={() =>
                                setSkillIds((current) =>
                                  checked
                                    ? current.filter((id) => id !== skill.id)
                                    : [...current, skill.id]
                                )
                              }
                              label={<Text>{skill.name}</Text>}
                            />
                          </Box>
                        )
                      })
                    )}
                  </Stack>
                </Box>

                <Box>
                  <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.14em">
                    Lead instructor
                  </Text>
                  <Select
                    mt="xs"
                    searchable
                    clearable
                    placeholder="No lead instructor"
                    value={lead}
                    onChange={(value) => {
                      setLead(value)
                      if (value) {
                        setSupporting((current) => current.filter((key) => key !== value))
                      }
                    }}
                    data={options}
                  />
                </Box>

                <Box>
                  <Group justify="space-between" align="baseline">
                    <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.14em">
                      Supporting
                    </Text>
                    <Text size="sm" c="dimmed">
                      {supporting.length || 'none'}
                    </Text>
                  </Group>
                  <Stack gap="xs" mt="xs">
                    {supportingOptions.length === 0 ? (
                      <Text size="sm" c="dimmed">
                        No other instructors available.
                      </Text>
                    ) : (
                      supportingOptions.map((option) => {
                        const checked = supporting.includes(option.key)
                        return (
                          <Box
                            key={option.key}
                            p="sm"
                            style={{
                              border: '1px solid var(--mantine-color-gray-3)',
                              borderRadius: 10,
                            }}
                          >
                            <Checkbox
                              checked={checked}
                              onChange={() =>
                                setSupporting((current) =>
                                  checked
                                    ? current.filter((key) => key !== option.key)
                                    : [...current, option.key]
                                )
                              }
                              label={
                                <Group gap="sm" wrap="nowrap">
                                  <Avatar size="sm" radius="xl" color="aqua">
                                    {instructorInitials(option.label)}
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

                <Text size="sm" c="dimmed">
                  Changes apply to this lesson only. New lessons inherit the class instructors.
                </Text>
              </Stack>

              {objectives.map((goal, index) => (
                <input key={goal} type="hidden" name={`objectives[${index}]`} value={goal} />
              ))}
              {skillIds.map((id, index) => (
                <input key={id} type="hidden" name={`skillIds[${index}]`} value={id} />
              ))}
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
              {supporting
                .filter((key) => key.startsWith(MEMBERSHIP_PREFIX))
                .map((key, index) => (
                  <input
                    key={key}
                    type="hidden"
                    name={`supportingInstructorMembershipIds[${index}]`}
                    value={key.slice(MEMBERSHIP_PREFIX.length)}
                  />
                ))}
              {supporting
                .filter((key) => key.startsWith(INVITATION_PREFIX))
                .map((key, index) => (
                  <input
                    key={key}
                    type="hidden"
                    name={`supportingInstructorInvitationIds[${index}]`}
                    value={key.slice(INVITATION_PREFIX.length)}
                  />
                ))}

              <Box p="lg" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                <Group justify="flex-end">
                  <Button type="button" variant="default" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={processing}
                    disabled={objectives.length === 0 || skillIds.length === 0}
                  >
                    Save changes
                  </Button>
                </Group>
              </Box>
            </Stack>
          )}
        </Form>
      )}
    </Drawer>
  )
}
