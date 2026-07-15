import { Badge, Button, Card, Group, Stack, Text } from '@mantine/core'
import { Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import { urlFor } from '~/client'

export default function ClassCard({ swimmingClass }: { swimmingClass: Data.SwimmingClass }) {
  return (
    <Card>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4}>
          <Group gap="xs">
            <Text fw={600}>{swimmingClass.name}</Text>
            <Badge variant="light" color="gray" size="sm">
              {swimmingClass.code}
            </Badge>
            {swimmingClass.isCancelled && (
              <Badge variant="light" color="red" size="sm">
                Cancelled
              </Badge>
            )}
          </Group>
          <Text size="sm">
            {swimmingClass.weekdayName} · {swimmingClass.startTime.formatted} ·{' '}
            {swimmingClass.durationMinutes} min
          </Text>
          <Text size="sm" c="dimmed">
            {swimmingClass.level?.programName} — {swimmingClass.level?.name}
            {swimmingClass.lessons.length > 0
              ? ` · ${swimmingClass.lessons.length} ${swimmingClass.lessons.length === 1 ? 'lesson' : 'lessons'} planned`
              : ' · no lessons yet'}
          </Text>
          {swimmingClass.instructor && (
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Instructor: {swimmingClass.instructor.label}
              </Text>
              {swimmingClass.instructor.status === 'pending' && (
                <Badge variant="light" color="yellow" size="sm">
                  Pending
                </Badge>
              )}
            </Group>
          )}
        </Stack>
        <Button
          component={Link}
          href={urlFor('swimming_classes.show', { id: swimmingClass.id })}
          size="xs"
          variant="light"
        >
          View
        </Button>
      </Group>
    </Card>
  )
}
