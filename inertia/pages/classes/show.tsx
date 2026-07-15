import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Pill,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { router } from '@inertiajs/react'
import { Form, Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import { urlFor } from '~/client'
import { Guard } from '~/utils/permissions'
import PlanLessonForm from '~/components/plan_lesson_form'

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
                  <div key={skill.id}>
                    <Text fw={500} size="sm">
                      {skill.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {skill.passCriteria}
                    </Text>
                  </div>
                ))
              )}
            </Stack>
          </Card>
        </SimpleGrid>

        <Stack gap="sm">
          <Group gap="xs">
            <Text fw={700}>Lessons</Text>
            <Badge variant="light" color="gray" size="sm">
              {swimmingClass.lessons.length}
            </Badge>
          </Group>

          {swimmingClass.lessons.length === 0 ? (
            <Card>
              <Text size="sm" c="dimmed">
                No lessons planned yet.
              </Text>
            </Card>
          ) : (
            swimmingClass.lessons.map((lesson) => (
              <Card key={lesson.id} padding="md">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Stack gap="xs">
                    <Text fw={600} size="sm">
                      {lesson.date.formatted}
                    </Text>
                    {lesson.activities.length === 0 ? (
                      <Text size="xs" c="dimmed">
                        No activities planned.
                      </Text>
                    ) : (
                      <Group gap="xs">
                        {lesson.activities.map((activity) => (
                          <Pill key={activity.id} bg="green.0" c="green.9">
                            {activity.name}
                          </Pill>
                        ))}
                      </Group>
                    )}
                  </Stack>
                  <Guard for="class.manage">
                    <Tooltip label="Remove lesson">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        aria-label={`Remove lesson ${lesson.date.formatted}`}
                        onClick={() =>
                          router.delete(urlFor('class_lessons.destroy', { id: lesson.id }))
                        }
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Guard>
                </Group>
              </Card>
            ))
          )}

          {!swimmingClass.isCancelled && (
            <Guard for="class.manage">
              <PlanLessonForm
                classId={swimmingClass.id}
                weekday={swimmingClass.weekday}
                weekdayName={swimmingClass.weekdayName}
                skills={swimmingClass.skills}
                existingDates={swimmingClass.lessons.map((lesson) => lesson.date.raw)}
              />
            </Guard>
          )}
        </Stack>
      </Stack>
    </Container>
  )
}
