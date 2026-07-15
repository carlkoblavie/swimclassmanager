import { Badge, Button, Card, Group, Stack, Text } from '@mantine/core'
import { Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import { urlFor } from '~/client'

export default function ClassCard({ swimmingClass }: { swimmingClass: Data.SwimmingClass }) {
  const nextSession = swimmingClass.sessions[0]

  return (
    <Card withBorder radius="md" padding="lg">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <div>
            <Group gap="xs">
              <Text fw={600} size="lg">
                {swimmingClass.name}
              </Text>
              {swimmingClass.isCancelled && <Badge color="red">Cancelled</Badge>}
            </Group>
            <Text size="sm" c="dimmed">
              {swimmingClass.code}
            </Text>
          </div>
          <Button
            component={Link}
            href={urlFor('swimming_classes.show', { id: swimmingClass.id })}
            size="xs"
            variant="light"
          >
            View
          </Button>
        </Group>

        <Text size="sm">
          {swimmingClass.level?.programName} — {swimmingClass.level?.name}
        </Text>
        <Text size="sm">Instructor: {swimmingClass.instructor.label}</Text>
        <Text size="sm">Location: {swimmingClass.location}</Text>
        <Text size="sm">Capacity: {swimmingClass.capacity} learners</Text>
        {nextSession && <Text size="sm">Next session: {nextSession.startsAt.formatted}</Text>}
      </Stack>
    </Card>
  )
}
