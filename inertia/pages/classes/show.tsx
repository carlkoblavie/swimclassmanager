import { Badge, Button, Card, Container, Group, Pill, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { Form, Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import { urlFor } from '~/client'
import { Guard } from '~/utils/permissions'

type PageProps = InertiaProps<{
  swimmingClass: Data.SwimmingClass
}>

export default function ClassShow({ swimmingClass }: PageProps) {
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Group gap="sm">
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
              {!swimmingClass.isCancelled && (
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
              )}
            </Guard>
            <Button component={Link} route="swimming_classes.index" variant="subtle">
              Back to classes
            </Button>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Card>
            <Stack gap="xs">
              <Text fw={700}>Class details</Text>
              <Text>
                {swimmingClass.level?.programName} — {swimmingClass.level?.name}
              </Text>
              <Text>
                {swimmingClass.weekdayName} · {swimmingClass.startTime.formatted} ·{' '}
                {swimmingClass.durationMinutes} min
              </Text>
              <Text>Capacity: {swimmingClass.level?.capacity} learners</Text>
              <Text>Location: {swimmingClass.location ?? 'Not set'}</Text>
              <Group gap="xs">
                <Text>Instructor: {swimmingClass.instructor?.label ?? 'Not assigned'}</Text>
                {swimmingClass.instructor?.status === 'pending' && (
                  <Badge variant="light" color="yellow" size="sm">
                    Pending
                  </Badge>
                )}
              </Group>
            </Stack>
          </Card>

          <Card>
            <Stack gap="xs">
              <Text fw={700}>Curriculum</Text>
              <Text size="sm" c="dimmed">
                Stage: {swimmingClass.stage?.name ?? 'Not set'}
              </Text>
              {swimmingClass.skills.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No skills selected.
                </Text>
              ) : (
                swimmingClass.skills.map((skill) => (
                  <Stack key={skill.id} gap={4}>
                    <Text fw={500} size="sm">
                      {skill.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {skill.passCriteria}
                    </Text>
                    <Group gap="xs">
                      {swimmingClass.activities
                        .filter((activity) => activity.skillId === skill.id)
                        .map((activity) => (
                          <Pill key={activity.id} bg="green.0" c="green.9">
                            {activity.name}
                          </Pill>
                        ))}
                    </Group>
                  </Stack>
                ))
              )}
            </Stack>
          </Card>
        </SimpleGrid>
      </Stack>
    </Container>
  )
}
