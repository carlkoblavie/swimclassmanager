import { useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Drawer,
  Group,
  Radio,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconCheck, IconChevronRight, IconX } from '@tabler/icons-react'

type InstructorOption = {
  value: string
  label: string
}

export default function BulkAssignLessonInstructorsDrawer({
  lessonIds,
  instructorOptions,
  opened,
  onClose,
  onSuccess,
}: {
  lessonIds: number[]
  instructorOptions: InstructorOption[]
  opened: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [lead, setLead] = useState<string | null>(null)
  const [supporting, setSupporting] = useState<string[]>([])

  const supportingOptions = instructorOptions.filter((option) => option.value !== lead)
  const membershipSupporting = supporting.filter((value) => value.startsWith('membership:'))
  const invitationSupporting = supporting.filter((value) => value.startsWith('invitation:'))
  const leadParts = lead?.split(':')

  const toggleSupporting = (value: string) => {
    setSupporting((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    )
  }

  const closeDrawer = () => {
    setLead(null)
    setSupporting([])
    onClose()
  }

  return (
    <Drawer
      opened={opened}
      onClose={closeDrawer}
      position="right"
      size={520}
      padding={0}
      withCloseButton={false}
      title={null}
    >
      <Form
        route="class_lessons.bulk_assign_instructors"
        onSuccess={() => {
          onSuccess()
          closeDrawer()
        }}
      >
        {({ processing }) => (
          <Stack gap={0} mih="100%">
            {lessonIds.map((lessonId, index) => (
              <input key={lessonId} type="hidden" name={`lessonIds[${index}]`} value={lessonId} />
            ))}
            {leadParts?.[0] === 'membership' && (
              <input type="hidden" name="leadInstructorMembershipId" value={leadParts[1]} />
            )}
            {leadParts?.[0] === 'invitation' && (
              <input type="hidden" name="leadInstructorInvitationId" value={leadParts[1]} />
            )}
            {membershipSupporting.map((value, index) => (
              <input
                key={value}
                type="hidden"
                name={`supportingInstructorMembershipIds[${index}]`}
                value={value.split(':')[1]}
              />
            ))}
            {invitationSupporting.map((value, index) => (
              <input
                key={value}
                type="hidden"
                name={`supportingInstructorInvitationIds[${index}]`}
                value={value.split(':')[1]}
              />
            ))}

            <Group justify="space-between" align="flex-start" p="lg">
              <Title order={2} fz="xl">
                Assign to {lessonIds.length} {lessonIds.length === 1 ? 'lesson' : 'lessons'}
              </Title>
              <ActionIcon variant="subtle" color="gray" aria-label="Close" onClick={closeDrawer}>
                <IconX size={20} />
              </ActionIcon>
            </Group>

            <Divider />

            <Stack gap="xl" p="lg" style={{ flex: 1 }}>
              <Box>
                <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.14em">
                  Lead
                </Text>
                <Radio.Group value={lead ?? ''} onChange={setLead} mt="xs">
                  <Stack gap="xs">
                    {instructorOptions.map((option) => (
                      <Box
                        key={option.value}
                        p="sm"
                        style={{
                          border: `1px solid ${lead === option.value ? 'var(--mantine-color-blue-5)' : 'var(--mantine-color-gray-3)'}`,
                          borderRadius: 12,
                          background:
                            lead === option.value ? 'var(--mantine-color-blue-0)' : undefined,
                        }}
                      >
                        <Radio value={option.value} label={option.label} />
                      </Box>
                    ))}
                  </Stack>
                </Radio.Group>
              </Box>

              <Box>
                <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.14em">
                  Supporting
                </Text>
                <Group gap="xs" mt="sm">
                  {supportingOptions.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      No other instructors available.
                    </Text>
                  ) : (
                    supportingOptions.map((option) => {
                      const selected = supporting.includes(option.value)
                      return (
                        <Button
                          key={option.value}
                          type="button"
                          size="sm"
                          radius="xl"
                          variant={selected ? 'light' : 'default'}
                          color={selected ? 'blue' : 'gray'}
                          leftSection={selected ? <IconCheck size={14} /> : undefined}
                          onClick={() => toggleSupporting(option.value)}
                        >
                          {option.label}
                        </Button>
                      )
                    })
                  )}
                </Group>
              </Box>
            </Stack>

            <Divider />

            <Group justify="space-between" p="lg">
              <Text size="sm" c="dimmed">
                Supporting staff are optional.
              </Text>
              <Button
                type="submit"
                loading={processing}
                disabled={!lead}
                rightSection={<IconChevronRight size={16} />}
              >
                Assign
              </Button>
            </Group>
          </Stack>
        )}
      </Form>
    </Drawer>
  )
}
