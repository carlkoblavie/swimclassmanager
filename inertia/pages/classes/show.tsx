import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { Form, Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import { urlFor } from '~/client'
import { Guard } from '~/utils/permissions'

type PageProps = InertiaProps<{
  swimmingClass: Data.SwimmingClass
}>

export default function ShowClass({ swimmingClass }: PageProps) {
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Group gap="xs">
              <Title order={1}>{swimmingClass.name}</Title>
              {swimmingClass.isCancelled && <Badge color="red">Cancelled</Badge>}
            </Group>
            <Text c="dimmed">{swimmingClass.code}</Text>
          </div>
          <Group gap="sm">
            <Guard for="class.manage">
              <Button
                component={Link}
                href={urlFor('swimming_classes.edit', { id: swimmingClass.id })}
                variant="light"
              >
                Edit class
              </Button>
              <Form route="swimming_classes.update" routeParams={{ id: swimmingClass.id }}>
                {({ processing }) => (
                  <>
                    <input type="hidden" name="intent" value="cancel" />
                    <Button type="submit" color="red" variant="light" loading={processing}>
                      Cancel class
                    </Button>
                  </>
                )}
              </Form>
            </Guard>
            <Button component={Link} route="programs.index" variant="subtle">
              Back to programs
            </Button>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Card withBorder radius="md" padding="lg">
            <Stack gap="xs">
              <Text fw={700}>Class details</Text>
              <Text>
                {swimmingClass.level?.programName} — {swimmingClass.level?.name}
              </Text>
              <Text>Location: {swimmingClass.location}</Text>
              <Text>Capacity: {swimmingClass.capacity} learners</Text>
              <Text>
                Dates: {swimmingClass.dateRange.start.formatted} to{' '}
                {swimmingClass.dateRange.end.formatted}
              </Text>
              <Text>
                Time: {swimmingClass.startTime}–{swimmingClass.endTime}
              </Text>
            </Stack>
          </Card>

          <Card withBorder radius="md" padding="lg">
            <Stack gap="xs">
              <Text fw={700}>Instructor</Text>
              <Group gap="xs">
                <Text>{swimmingClass.instructor.label}</Text>
                {swimmingClass.instructor.status === 'pending' && <Badge>Pending</Badge>}
              </Group>
            </Stack>
          </Card>
        </SimpleGrid>

        <Card withBorder radius="md" padding="lg">
          <Stack gap="md">
            <Title order={2}>Stages</Title>
            {swimmingClass.stages.length === 0 ? (
              <Text c="dimmed">No stages added.</Text>
            ) : (
              swimmingClass.stages.map((stage) => (
                <Stack key={stage.id} gap="xs">
                  <Text fw={600}>
                    {stage.position}. {stage.name}
                  </Text>
                  <Group gap="xs">
                    {stage.skills.map((skill) => (
                      <Badge key={skill.id} variant="light">
                        {skill.name}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              ))
            )}
          </Stack>
        </Card>

        <Card withBorder radius="md" padding="lg">
          <Stack gap="md">
            <Title order={2}>Schedule</Title>
            {swimmingClass.sessions.length === 0 ? (
              <Text c="dimmed">No sessions generated.</Text>
            ) : (
              swimmingClass.sessions.map((session) => (
                <Group key={session.id} justify="space-between">
                  <Group gap="xs">
                    <Text>
                      {session.startsAt.formatted} – {session.endsAt.formatted}
                    </Text>
                    {session.isCancelled && <Badge color="red">Cancelled</Badge>}
                  </Group>
                  {!session.isCancelled && (
                    <Guard for="class.manage">
                      <Form route="swimming_class_sessions.update" routeParams={{ id: session.id }}>
                        {({ processing }) => (
                          <>
                            <input type="hidden" name="intent" value="cancel" />
                            <Button type="submit" size="xs" variant="subtle" loading={processing}>
                              Cancel session
                            </Button>
                          </>
                        )}
                      </Form>
                    </Guard>
                  )}
                </Group>
              ))
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
