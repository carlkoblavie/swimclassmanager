import { Anchor, Badge, Box, Button, Card, Divider, Group, Stack, Text } from '@mantine/core'
import { IconArrowRight, IconClock } from '@tabler/icons-react'
import { Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import { urlFor } from '~/client'
import { Guard } from '~/utils/permissions'

function lessonDateRange(swimmingClass: Data.SwimmingClass) {
  if (swimmingClass.lessons.length === 0) {
    return swimmingClass.term
      ? `${swimmingClass.term.swimYearName} ${swimmingClass.term.name}`
      : 'No lesson dates yet'
  }

  const first = swimmingClass.lessons[0]
  const last = swimmingClass.lessons[swimmingClass.lessons.length - 1]
  return last.id === first.id
    ? first.date.formatted
    : `${first.date.formatted} – ${last.date.formatted}`
}

function lessonLabel(swimmingClass: Data.SwimmingClass) {
  const count = swimmingClass.lessons.length
  return `${count} ${count === 1 ? 'lesson' : 'lessons'} scheduled`
}

function enrollmentLabel(swimmingClass: Data.SwimmingClass) {
  const enrolled = swimmingClass.enrolledCount ?? 0
  const capacity = swimmingClass.level?.capacity
  if (typeof capacity !== 'number') {
    return `${enrolled} enrolled`
  }
  return enrolled >= capacity
    ? `Full · ${enrolled}/${capacity}`
    : `${enrolled}/${capacity} enrolled`
}

export default function ClassCard({
  swimmingClass,
  showLessons = false,
}: {
  swimmingClass: Data.SwimmingClass
  showLessons?: boolean
}) {
  const leadInstructor = swimmingClass.leadInstructor
  const supportingInstructors = swimmingClass.supportingInstructors ?? []
  const hasLessons = swimmingClass.lessons.length > 0
  const programName = swimmingClass.level?.programName ?? 'Program'
  const levelName = swimmingClass.level?.name ?? 'Level not set'
  const stageName = swimmingClass.stage?.name ?? 'Stage not set'

  return (
    <Card withBorder shadow="none" radius="md" padding={0} style={{ overflow: 'hidden' }}>
      <Box p="md">
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
          <Stack gap="xs" style={{ minWidth: 0 }}>
            <Text size="xs" tt="uppercase" c="dimmed" fw={700} lts="0.12em" truncate>
              {programName} › {levelName} › {stageName}
            </Text>
            <Group gap="xs" wrap="nowrap">
              <Text fw={800} fz="lg" truncate>
                {swimmingClass.name}
              </Text>
              <Badge variant="light" color="gray" size="sm">
                {swimmingClass.code}
              </Badge>
            </Group>
          </Stack>
          <Group gap="xs" wrap="nowrap">
            {swimmingClass.isCancelled && (
              <Badge variant="light" color="red" size="sm">
                Cancelled
              </Badge>
            )}
            <Button
              component={Link}
              href={urlFor('lessons.index', [], { qs: { classId: swimmingClass.id } })}
              size="xs"
              variant="subtle"
            >
              View
            </Button>
          </Group>
        </Group>

        <Group gap="sm" mt="md" wrap="nowrap">
          <IconClock size={18} color="var(--mantine-color-gray-5)" />
          <Text fw={600} c="dark">
            {swimmingClass.weekdayName && swimmingClass.startTime
              ? `${swimmingClass.weekdayName} · ${swimmingClass.startTime.formatted}`
              : swimmingClass.weekdayName ||
                swimmingClass.startTime?.formatted ||
                'Schedule not set'}
          </Text>
          <Text c="dimmed">·</Text>
          <Text c="dimmed">
            {typeof swimmingClass.durationMinutes === 'number'
              ? `${swimmingClass.durationMinutes} min`
              : 'Duration not set'}
          </Text>
        </Group>
      </Box>

      <Box
        p="md"
        style={{
          borderTop: '1px solid var(--mantine-color-gray-2)',
          background: hasLessons ? 'var(--mantine-color-gray-0)' : 'var(--mantine-color-yellow-0)',
        }}
      >
        <Group justify="space-between" align="center" gap="sm">
          <Group gap="xs" wrap="nowrap">
            <Text c={hasLessons ? 'teal.7' : 'yellow.8'} fw={700} size="sm">
              <Text span mr={6}>
                ●
              </Text>
              {hasLessons ? lessonLabel(swimmingClass) : 'No lessons scheduled'}
            </Text>
          </Group>
          {hasLessons ? (
            <Text c="dimmed" size="sm" style={{ whiteSpace: 'nowrap' }}>
              {enrollmentLabel(swimmingClass)}
            </Text>
          ) : (
            <Guard for="lesson.generate">
              <Anchor
                component={Link}
                href={urlFor('lessons.index', [], {
                  qs: { classId: swimmingClass.id, generate: '1' },
                })}
                fw={700}
                size="sm"
              >
                Generate <IconArrowRight size={15} style={{ verticalAlign: 'middle' }} />
              </Anchor>
            </Guard>
          )}
        </Group>
        <Text c="dimmed" size="sm" mt={6}>
          {lessonDateRange(swimmingClass)}
        </Text>
      </Box>

      {(leadInstructor || supportingInstructors.length > 0) && (
        <Box px="md" pb="md">
          <Divider mb="sm" />
          <Stack gap={2}>
            {leadInstructor && (
              <Group gap={6} wrap="wrap">
                <Text size="sm" c="dimmed">
                  Lead:
                </Text>
                <Text size="sm" c="dimmed">
                  {leadInstructor.label}
                  {leadInstructor.status === 'pending' && ' · Pending'}
                </Text>
              </Group>
            )}
            {supportingInstructors.length > 0 && (
              <Group gap={6} wrap="wrap">
                <Text size="sm" c="dimmed">
                  Supporting:
                </Text>
                <Text size="sm" c="dimmed">
                  {supportingInstructors.map((instructor) => instructor.label).join(', ')}
                </Text>
              </Group>
            )}
          </Stack>
        </Box>
      )}

      {showLessons && swimmingClass.lessons.length > 0 && (
        <>
          <Divider my="sm" />
          <Stack gap={4} p="md">
            <Text size="xs" tt="uppercase" c="dimmed" fw={700}>
              Lessons
            </Text>
            {swimmingClass.lessons.map((lesson) => (
              <Group key={lesson.id} gap="xs" wrap="nowrap" align="baseline">
                <Text size="sm" w={170} style={{ flexShrink: 0 }}>
                  {lesson.date.formatted}
                </Text>
                <Text size="sm" c="dimmed">
                  {lesson.activities.length > 0
                    ? lesson.activities.map((activity) => activity.name).join(', ')
                    : 'No activities planned'}
                </Text>
              </Group>
            ))}
          </Stack>
        </>
      )}
    </Card>
  )
}
