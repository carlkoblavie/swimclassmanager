import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Form, Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import { urlFor } from '~/client'
import { Guard } from '~/utils/permissions'
import EditLessonForm from '~/components/edit_lesson_form'
import MetaStrip from '~/components/meta_strip'
import PlanLessonForm from '~/components/plan_lesson_form'

type PageProps = InertiaProps<{
  swimmingClass: Data.SwimmingClass
  activityBank: Data.SchoolActivityCategory[]
}>

type Lesson = Data.SwimmingClass['lessons'][number]
type ClassInstructor = Data.SwimmingClass['instructors'][number]

function instructorBadges(instructors: ClassInstructor[]) {
  if (instructors.length === 0) {
    return 'Not assigned'
  }

  return (
    <Group gap="xs" wrap="wrap">
      {instructors.map((instructor) => (
        <Group key={`${instructor.type}-${instructor.id}`} gap={4} wrap="nowrap">
          {instructor.label}
          {instructor.status === 'pending' && (
            <Badge variant="light" color="yellow" size="sm">
              Pending
            </Badge>
          )}
        </Group>
      ))}
    </Group>
  )
}

// Names of the skills this lesson's activities belong to.
function skillFocus(lesson: Lesson, skills: Data.SwimmingClass['skills']): string[] {
  const skillIds = new Set(lesson.activities.map((activity) => activity.skillId))
  return skills.filter((skill) => skillIds.has(skill.id)).map((skill) => skill.name)
}

function lessonActivityGroups(lesson: Lesson, skills: Data.SwimmingClass['skills']) {
  const groups = new Map<string, Lesson['activities']>()

  for (const activity of lesson.activities.toSorted((a, b) => a.position - b.position)) {
    const skill = activity.skillId
      ? skills.find((candidate) => candidate.id === activity.skillId)
      : undefined
    const groupName = activity.categoryName ?? skill?.name ?? 'Other activities'
    groups.set(groupName, [...(groups.get(groupName) ?? []), activity])
  }

  return [...groups.entries()].map(([name, activities]) => ({ name, activities }))
}

function lessonPlannedMinutes(lesson: Lesson) {
  return lesson.activities.reduce((total, activity) => total + (activity.durationMinutes ?? 0), 0)
}

function lessonActivityLeaderLabel(value: number | null) {
  if (value === 2) {
    return 'Learner-led'
  }

  if (value === 3) {
    return 'Mixed'
  }

  return value === 1 ? 'Instructor-led' : null
}

function lessonSkills(swimmingClass: Data.SwimmingClass): Data.SwimmingClass['skills'] {
  return swimmingClass.skills.length > 0
    ? swimmingClass.skills
    : (swimmingClass.stage?.skills ?? [])
}

export default function ClassShow({ swimmingClass, activityBank }: PageProps) {
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null)
  const skillsForLessons = lessonSkills(swimmingClass)

  const plannedCount = swimmingClass.lessons.filter(
    (lesson) => lesson.activities.length > 0 || Boolean(lesson.objectives)
  ).length
  const leadInstructor = swimmingClass.leadInstructor
  const supportingInstructors = swimmingClass.supportingInstructors ?? []

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Anchor component={Link} route="swimming_classes.index" size="sm">
          ← Classes
        </Anchor>

        {/* Class hero */}
        <Card padding={0}>
          <Group justify="space-between" align="flex-start" p="lg" wrap="wrap">
            <Group gap="md" align="flex-start" wrap="nowrap">
              <Box
                bg="aqua.0"
                c="aqua.8"
                w={54}
                h={54}
                style={{
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Text fw={800} fz="md" lh={1}>
                  {(swimmingClass.weekdayName ?? 'TBD').slice(0, 3)}
                </Text>
                <Text fz={10} fw={700} tt="uppercase" lh={1} mt={3}>
                  {swimmingClass.startTime?.formatted ?? '—'}
                </Text>
              </Box>
              <div>
                <Group gap="xs">
                  <Title order={1} fz="h2">
                    {swimmingClass.name}
                  </Title>
                  <Badge variant="light" color="gray" size="sm">
                    {swimmingClass.code}
                  </Badge>
                  {swimmingClass.isCancelled && (
                    <Badge variant="light" color="red" size="sm">
                      Cancelled
                    </Badge>
                  )}
                </Group>
                <Text size="sm" c="dimmed" mt={4}>
                  Program:{' '}
                  {swimmingClass.level ? (
                    <>
                      <Anchor
                        component={Link}
                        href={urlFor('programs.show', { id: swimmingClass.level.programId })}
                        size="sm"
                        fw={600}
                      >
                        {swimmingClass.level.programName}
                      </Anchor>{' '}
                      —{' '}
                      <Anchor
                        component={Link}
                        href={urlFor('levels.show', { id: swimmingClass.level.id })}
                        size="sm"
                        fw={600}
                      >
                        {swimmingClass.level.name}
                      </Anchor>
                    </>
                  ) : (
                    'Not set'
                  )}{' '}
                  · Weekly class
                </Text>
              </div>
            </Group>
            <Guard for="class.manage">
              <Group gap="sm">
                <Button
                  component={Link}
                  href={urlFor('swimming_classes.edit', { id: swimmingClass.id })}
                  variant="default"
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
              </Group>
            </Guard>
          </Group>
          <Divider />
          <MetaStrip
            items={[
              {
                label: 'Day & time',
                value: swimmingClass.startTime
                  ? `${swimmingClass.weekdayName} · ${swimmingClass.startTime.formatted}`
                  : 'Not scheduled',
              },
              { label: 'Duration', value: `${swimmingClass.durationMinutes} min` },
              {
                label: 'Lead instructor',
                value: instructorBadges(leadInstructor ? [leadInstructor] : []),
              },
              {
                label: 'Supporting instructors',
                value: instructorBadges(supportingInstructors),
              },
              { label: 'Location', value: swimmingClass.location ?? 'Not set' },
              {
                label: 'Term',
                value: swimmingClass.term
                  ? `${swimmingClass.term.swimYearName} · ${swimmingClass.term.name}`
                  : 'Not set',
              },
              {
                label: 'Term dates',
                value: swimmingClass.term
                  ? `${swimmingClass.term.startsOn.formatted} – ${swimmingClass.term.endsOn.formatted}`
                  : '—',
              },
              { label: 'Stage', value: swimmingClass.stage?.name ?? 'Not set' },
              {
                label: 'Capacity',
                value:
                  typeof swimmingClass.level?.capacity === 'number'
                    ? `${swimmingClass.level.capacity} learners`
                    : '—',
              },
              { label: 'Skills', value: swimmingClass.skills.length },
              {
                label: 'Lessons planned',
                value: swimmingClass.lessonAllowance
                  ? `${swimmingClass.lessons.length} of ${swimmingClass.lessonAllowance}`
                  : plannedCount,
              },
            ]}
          />
        </Card>

        {/* Lessons */}
        <Group justify="space-between" align="center">
          <Title order={2} fz="lg">
            Lessons
          </Title>
          <Text size="sm" c="dimmed">
            {swimmingClass.lessons.length}{' '}
            {swimmingClass.lessons.length === 1 ? 'lesson' : 'lessons'} · {plannedCount} planned
          </Text>
        </Group>

        {swimmingClass.lessons.length === 0 && (
          <Card>
            <Text size="sm" c="dimmed">
              No lessons planned yet.
            </Text>
          </Card>
        )}

        {swimmingClass.lessons.map((lesson, index) => {
          const focus = skillFocus(lesson, skillsForLessons)
          const isPlanned = lesson.activities.length > 0 || Boolean(lesson.objectives)
          const plannedMinutes = lessonPlannedMinutes(lesson)

          return (
            <Card key={lesson.id} padding={0}>
              <Group gap="md" p="md" px="lg" wrap="nowrap" align="center">
                <ThemeIcon variant="light" radius="md" size={30}>
                  <Text size="xs" fw={800}>
                    {index + 1}
                  </Text>
                </ThemeIcon>
                <div>
                  <Text fw={700} size="sm">
                    {lesson.date.formatted}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {swimmingClass.startTime ? `${swimmingClass.startTime.formatted} · ` : ''}
                    {swimmingClass.durationMinutes} min ·{' '}
                    {plannedMinutes} planned
                  </Text>
                </div>
                <Group gap="xs" ml="auto" wrap="nowrap">
                  {isPlanned ? (
                    <Badge variant="light" color="green" size="sm">
                      Planned
                    </Badge>
                  ) : (
                    <Badge variant="light" color="yellow" size="sm">
                      Draft
                    </Badge>
                  )}
                  <Guard for="class.manage">
                    <Tooltip label="Edit lesson">
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        aria-label={`Edit lesson ${lesson.date.formatted}`}
                        onClick={() =>
                          setEditingLessonId((current) =>
                            current === lesson.id ? null : lesson.id
                          )
                        }
                      >
                        <IconPencil size={14} />
                      </ActionIcon>
                    </Tooltip>
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
              </Group>
              <Divider />
              <Stack gap="sm" p="lg" pt="md">
                {isPlanned ? (
                  <>
                    {lesson.objectives && (
                      <Box
                        p="sm"
                        style={{
                          border: '1px solid var(--mantine-color-gray-3)',
                          borderRadius: 10,
                        }}
                      >
                        <Text size="xs" tt="uppercase" c="dimmed" fw={700} lts="0.05em">
                          Lesson objectives
                        </Text>
                        <Text size="sm" mt={4}>
                          {lesson.objectives}
                        </Text>
                      </Box>
                    )}
                    {focus.length > 0 && (
                      <Text size="xs" tt="uppercase" c="dimmed" fw={700} lts="0.05em">
                        Skill focus ·{' '}
                        <Text span size="xs" fw={700} c="aqua.8" tt="uppercase" lts="0.05em">
                          {focus.join(', ')}
                        </Text>
                      </Text>
                    )}
                    <Stack gap="md">
                      {lessonActivityGroups(lesson, skillsForLessons).map((group) => (
                        <Stack key={group.name} gap="xs">
                          <Text size="sm" fw={700} c="aqua.8">
                            {group.name}
                          </Text>
                          {group.activities.map((activity, activityIndex) => (
                            <Group
                              key={activity.id}
                              gap="sm"
                              align="flex-start"
                              wrap="nowrap"
                              p="sm"
                              style={{
                                border: '1px solid var(--mantine-color-gray-3)',
                                borderRadius: 10,
                              }}
                            >
                              <Text
                                size="sm"
                                c="dimmed"
                                w={18}
                                ta="right"
                                style={{ flexShrink: 0 }}
                              >
                                {activityIndex + 1}
                              </Text>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Group gap="xs" align="center">
                                  <Text size="sm" fw={700}>
                                    {activity.name}
                                  </Text>
                                </Group>
                                {activity.description && (
                                  <Text size="xs" c="dimmed" mt={2}>
                                    {activity.description}
                                  </Text>
                                )}
                                {lessonActivityLeaderLabel(activity.ledBy) && (
                                  <Text size="xs" c="dimmed" mt={2}>
                                    {lessonActivityLeaderLabel(activity.ledBy)}
                                  </Text>
                                )}
                                {activity.successCue && (
                                  <Text size="xs" c="dimmed" mt={2}>
                                    Success cue: {activity.successCue}
                                  </Text>
                                )}
                              </div>
                              {activity.durationMinutes && (
                                <Text
                                  size="xs"
                                  fw={800}
                                  c="aqua.8"
                                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                                >
                                  {activity.durationMinutes} MIN
                                </Text>
                              )}
                            </Group>
                          ))}
                        </Stack>
                      ))}
                    </Stack>
                    {lesson.isConcluded && (
                      <Box
                        p="sm"
                        style={{
                          border: '1px solid var(--mantine-color-green-3)',
                          borderRadius: 10,
                        }}
                      >
                        <Text size="xs" tt="uppercase" c="dimmed" fw={700} lts="0.05em">
                          Lesson observation
                        </Text>
                        <Text size="sm" mt={4}>
                          {lesson.observation}
                        </Text>
                      </Box>
                    )}
                  </>
                ) : (
                  <Group
                    justify="space-between"
                    p="md"
                    style={{
                      border: '1px dashed var(--mantine-color-gray-4)',
                      borderRadius: 10,
                    }}
                  >
                    <div>
                      <Text size="sm" fw={700} c="dimmed">
                        No activities planned yet
                      </Text>
                      <Text size="xs" c="dimmed">
                        Add activities from the {swimmingClass.level?.name ?? 'level'} curriculum to
                        build this lesson.
                      </Text>
                    </div>
                    <Guard for="class.manage">
                      <Button
                        type="button"
                        size="xs"
                        variant="light"
                        onClick={() => setEditingLessonId(lesson.id)}
                      >
                        + Plan activities
                      </Button>
                    </Guard>
                  </Group>
                )}
                {lesson.notes && (
                  <Text size="xs" c="dimmed" fs="italic">
                    {lesson.notes}
                  </Text>
                )}
                {editingLessonId === lesson.id && (
                  <EditLessonForm
                    lesson={lesson}
                    skills={skillsForLessons}
                    activityBank={activityBank}
                    durationMinutes={swimmingClass.durationMinutes}
                    onCancel={() => setEditingLessonId(null)}
                  />
                )}
              </Stack>
            </Card>
          )
        })}

        {!swimmingClass.isCancelled && editingLessonId === null && (
          <Guard for="class.manage">
            {swimmingClass.lessonAllowance &&
            swimmingClass.lessons.length >= swimmingClass.lessonAllowance ? (
              <Card>
                <Text size="sm" c="dimmed">
                  All {swimmingClass.lessonAllowance} lessons this level allows are planned.
                </Text>
              </Card>
            ) : (
              <PlanLessonForm
                classId={swimmingClass.id}
                weekday={swimmingClass.weekday ?? 1}
                weekdayName={swimmingClass.weekdayName ?? ''}
                existingDates={swimmingClass.lessons.map((lesson) => lesson.date.raw)}
                skills={skillsForLessons}
                activityBank={activityBank}
                durationMinutes={swimmingClass.durationMinutes}
              />
            )}
          </Guard>
        )}
      </Stack>
    </Container>
  )
}
