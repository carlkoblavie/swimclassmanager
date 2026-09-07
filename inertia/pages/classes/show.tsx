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
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core'
import { IconCalendar, IconPencil, IconPrinter, IconTrash } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Form, Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import { urlFor } from '~/client'
import { Guard } from '~/utils/permissions'
import EditLessonForm from '~/components/edit_lesson_form'
import EditLessonActivitiesForm from '~/components/edit_lesson_activities_form'
import LessonSkillTiles from '~/components/lesson_skill_tiles'
import MetaStrip from '~/components/meta_strip'

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
        </Group>
      ))}
    </Group>
  )
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

function lessonPlanCode(lesson: Lesson) {
  return `LP-${String(lesson.id).padStart(4, '0')}`
}

function isLessonPlanned(lesson: Lesson) {
  return lesson.activities.length > 0 || Boolean(lesson.objectives)
}

function formatClock(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
}

function lessonTimeRange(
  swimmingClass: Data.SwimmingClass,
  durationMinutes = swimmingClass.durationMinutes
) {
  if (!swimmingClass.startTime?.raw) {
    return null
  }

  const [hour, minute] = swimmingClass.startTime.raw.split(':').map(Number)
  const start = new Date(2000, 0, 1, hour, minute)
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
  return `${formatClock(start)} – ${formatClock(end)}`
}

export default function ClassShow({ swimmingClass, activityBank }: PageProps) {
  const { url, props } = usePage()
  const canEditLesson = ((props.userPermissions as string[] | undefined) ?? []).includes(
    'lesson.edit'
  )
  const searchParams = new URL(url, 'http://localhost').searchParams
  const focusedLessonId = Number(
    searchParams.get('editLessonId') ?? searchParams.get('lessonId') ?? 0
  )
  const editLessonId = Number(searchParams.get('editLessonId') ?? 0)
  const editLessonExists = swimmingClass.lessons.some((lesson) => lesson.id === editLessonId)
  const [editingLessonId, setEditingLessonId] = useState<number | null>(() =>
    canEditLesson && editLessonExists ? editLessonId : null
  )
  const [editingActivitiesLessonId, setEditingActivitiesLessonId] = useState<number | null>(() =>
    !canEditLesson && editLessonExists ? editLessonId : null
  )
  useEffect(() => {
    setEditingLessonId(canEditLesson && editLessonExists ? editLessonId : null)
    setEditingActivitiesLessonId(!canEditLesson && editLessonExists ? editLessonId : null)
  }, [canEditLesson, editLessonExists, editLessonId, url])
  const skillsForLessons = lessonSkills(swimmingClass)
  const displayedLessons = focusedLessonId
    ? swimmingClass.lessons.filter((lesson) => lesson.id === focusedLessonId)
    : swimmingClass.lessons
  const nextLessons = focusedLessonId
    ? swimmingClass.lessons.filter((lesson) => lesson.id !== focusedLessonId)
    : []
  const nextLessonsToPlan = nextLessons.filter((lesson) => !isLessonPlanned(lesson)).length

  const plannedCount = swimmingClass.lessons.filter(
    (lesson) => lesson.activities.length > 0 || Boolean(lesson.objectives)
  ).length
  const focusedLesson = focusedLessonId
    ? swimmingClass.lessons.find((lesson) => lesson.id === focusedLessonId)
    : undefined
  const leadInstructor = focusedLesson?.leadInstructor ?? swimmingClass.leadInstructor
  const supportingInstructors =
    focusedLesson?.supportingInstructors ?? swimmingClass.supportingInstructors ?? []
  const displayedDurationMinutes = focusedLesson?.durationMinutes ?? swimmingClass.durationMinutes

  return (
    <Container className="lesson-print-page" size="lg" py="xl">
      <Stack gap="lg">
        <Anchor className="screen-only" component={Link} route="lessons.index" size="sm">
          ← Lessons
        </Anchor>

        {!focusedLessonId && (
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
              <Guard for="lesson.generate">
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
                { label: 'Duration', value: `${displayedDurationMinutes} min` },
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
                  label: 'Lessons at level',
                  value:
                    typeof swimmingClass.levelLessonCount === 'number' &&
                    typeof swimmingClass.lessonAllowance === 'number'
                      ? `${swimmingClass.levelLessonCount} of ${swimmingClass.lessonAllowance}`
                      : plannedCount,
                },
              ]}
            />
            <Box
              mt="md"
              p="sm"
              bg="aqua.0"
              style={{
                border: '1px solid var(--mantine-color-aqua-2)',
                borderRadius: 12,
              }}
            >
              <Stack gap={4}>
                <Group gap="sm" wrap="nowrap">
                  <Text size="xs" fw={800} tt="uppercase" c="aqua.8" lts="0.08em">
                    Class Aim
                  </Text>
                  <Text fw={800} size="sm">
                    {swimmingClass.aim || 'Not specified'}
                  </Text>
                </Group>
                <Text size="sm" c="dimmed">
                  Pre-requisite:{' '}
                  {swimmingClass.prerequisiteStage
                    ? `${swimmingClass.level?.name ?? 'Level'} - ${swimmingClass.prerequisiteStage.name}`
                    : 'No prerequisite'}
                </Text>
                {swimmingClass.assessmentGoals.length > 0 && (
                  <Stack gap={2} mt="xs">
                    <Text size="xs" fw={800} tt="uppercase" c="aqua.8" lts="0.08em">
                      Assessment goals
                    </Text>
                    {swimmingClass.assessmentGoals.map((goal, index) => (
                      <Text key={index} size="sm">
                        • {goal}
                      </Text>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Box>
          </Card>
        )}

        {/* Lessons */}
        {!focusedLessonId && (
          <Group justify="space-between" align="center">
            <Title order={2} fz="lg">
              Lessons
            </Title>
            <Group gap="sm">
              <Text size="sm" c="dimmed">
                {swimmingClass.lessons.length}{' '}
                {swimmingClass.lessons.length === 1 ? 'lesson' : 'lessons'} · {plannedCount} planned
              </Text>
              <Guard for="class.manage">
                <Button
                  component={Link}
                  href={urlFor('lessons.index', [], {
                    qs: { classId: swimmingClass.id, generate: '1' },
                  })}
                  variant="light"
                  leftSection={<IconCalendar size={16} />}
                >
                  Generate lessons
                </Button>
              </Guard>
            </Group>
          </Group>
        )}

        {swimmingClass.lessons.length === 0 && (
          <Card>
            <Text size="sm" c="dimmed">
              No lessons planned yet.
            </Text>
          </Card>
        )}

        {displayedLessons.map((lesson) => {
          const lessonNumber = swimmingClass.lessons.findIndex((item) => item.id === lesson.id) + 1
          const isPlanned = isLessonPlanned(lesson)
          const plannedMinutes = lessonPlannedMinutes(lesson)
          const timeRange = lessonTimeRange(swimmingClass, lesson.durationMinutes)

          return (
            <Card className="lesson-print-card" key={lesson.id} padding={0}>
              <Group className="screen-only" gap="md" p="md" px="lg" wrap="nowrap" align="center">
                <ThemeIcon variant="light" radius="md" size={30}>
                  <Text size="xs" fw={800}>
                    {lessonNumber}
                  </Text>
                </ThemeIcon>
                <div>
                  <Text fw={700} size="sm">
                    {lesson.date.formatted}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {swimmingClass.startTime ? `${swimmingClass.startTime.formatted} · ` : ''}
                    {lesson.durationMinutes} min · {plannedMinutes} planned
                  </Text>
                </div>
                <Group gap="xs" ml="auto" wrap="nowrap">
                  {!isPlanned && (
                    <Box ta="right" style={{ flexShrink: 0, marginRight: 8 }}>
                      <Text fw={800} fz={24} c="teal.7" lh={1.05}>
                        #{lessonNumber}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {lesson.durationMinutes} min
                      </Text>
                    </Box>
                  )}
                  {isPlanned ? (
                    <Badge variant="light" color="green" size="sm">
                      Planned
                    </Badge>
                  ) : (
                    <Badge variant="light" color="yellow" size="sm">
                      Draft
                    </Badge>
                  )}
                  <Button
                    type="button"
                    variant="default"
                    leftSection={<IconPrinter size={16} />}
                    onClick={() => window.print()}
                  >
                    Print
                  </Button>
                  <Guard for="lesson.edit">
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
                  </Guard>
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
                  {!canEditLesson && (
                    <Guard for="lesson.activities.manage">
                      <Tooltip label="Edit activities">
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          aria-label={`Edit activities for ${lesson.date.formatted}`}
                          onClick={() =>
                            setEditingActivitiesLessonId((current) =>
                              current === lesson.id ? null : lesson.id
                            )
                          }
                        >
                          <IconPencil size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Guard>
                  )}
                </Group>
              </Group>
              <Divider />
              <Stack gap="sm" p="md" pt="sm">
                {!isPlanned && (
                  <Box
                    p="sm"
                    bg="aqua.0"
                    style={{
                      border: '1px solid var(--mantine-color-aqua-2)',
                      borderRadius: 12,
                    }}
                  >
                    <Text size="xs" fw={800} tt="uppercase" c="aqua.8" lts="0.08em">
                      Class aim
                    </Text>
                    <Text fw={800} size="sm" mt={4}>
                      {swimmingClass.aim || 'Not specified'}
                    </Text>
                    {swimmingClass.assessmentGoals.length > 0 && (
                      <Box mt="sm">
                        <Text size="xs" fw={800} tt="uppercase" c="aqua.8" lts="0.08em">
                          Assessment goals
                        </Text>
                        <Stack gap={2} mt={4}>
                          {swimmingClass.assessmentGoals.map((goal, index) => (
                            <Text key={`${goal}-${index}`} size="sm">
                              • {goal}
                            </Text>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                )}
                {isPlanned ? (
                  <Box className="lesson-plan-print-content" p="sm">
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <Box style={{ minWidth: 0 }}>
                        <Text size="xs" fw={800} tt="uppercase" c="dimmed" lts="0.1em">
                          Lesson plan · {lessonPlanCode(lesson)}
                        </Text>
                        <Title order={3} fz={22} mt={4}>
                          {swimmingClass.name}
                        </Title>
                        <Text c="dimmed" size="sm" mt={2}>
                          {lesson.date.formatted}
                          {timeRange ? ` · ${timeRange}` : ''}
                        </Text>
                      </Box>
                      <Box ta="right" style={{ flexShrink: 0 }}>
                        <Text fw={800} fz={24} c="teal.7" lh={1.05}>
                          #{lessonNumber}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {swimmingClass.durationMinutes} min
                        </Text>
                      </Box>
                    </Group>

                    <Group
                      className="lesson-print-meta-grid"
                      gap={1}
                      bg="gray.2"
                      align="stretch"
                      wrap="nowrap"
                      mt="lg"
                      style={{
                        border: '1px solid var(--mantine-color-gray-2)',
                        borderRadius: 12,
                        overflow: 'hidden',
                      }}
                    >
                      {[
                        { label: 'Stage', value: swimmingClass.stage?.name ?? 'Not set' },
                        { label: 'Level', value: swimmingClass.level?.name ?? 'Not set' },
                        {
                          label: 'Instructor',
                          value: (
                            <Stack gap={2}>
                              <Text size="sm" fw={700}>
                                Lead: {leadInstructor?.label ?? 'Not assigned'}
                              </Text>
                              <Text size="sm" fw={700}>
                                Support:{' '}
                                {supportingInstructors.length > 0
                                  ? supportingInstructors
                                      .map((instructor) => instructor.label)
                                      .join(', ')
                                  : 'None'}
                              </Text>
                            </Stack>
                          ),
                        },
                        {
                          label: 'Capacity',
                          value:
                            typeof swimmingClass.level?.capacity === 'number'
                              ? `${swimmingClass.level.capacity} learners`
                              : '—',
                        },
                      ].map((item) => (
                        <Box
                          key={item.label}
                          bg="white"
                          p="sm"
                          style={{ flex: '1 1 0', minWidth: 0 }}
                        >
                          <Text size="xs" fw={800} tt="uppercase" c="dimmed" lts="0.08em">
                            {item.label}
                          </Text>
                          <Text fw={800} size="sm" mt={4}>
                            {item.value}
                          </Text>
                        </Box>
                      ))}
                    </Group>

                    <Stack
                      mt="md"
                      gap={0}
                      bg="aqua.0"
                      style={{
                        border: '1px solid var(--mantine-color-aqua-2)',
                        borderRadius: 12,
                        overflow: 'hidden',
                      }}
                    >
                      <Group gap="sm" wrap="nowrap" p="sm">
                        <Text size="xs" fw={800} tt="uppercase" c="aqua.8" lts="0.08em">
                          Class Aim
                        </Text>
                        <Text fw={800} size="sm">
                          {swimmingClass.aim || 'Not specified'}
                        </Text>
                      </Group>
                    </Stack>

                    {(() => {
                      const lessonGoals = (lesson.objectives ?? '')
                        .split('\n')
                        .map((goal) => goal.trim())
                        .filter(Boolean)
                      if (lessonGoals.length === 0) {
                        return null
                      }
                      return (
                        <Box
                          mt="md"
                          p="sm"
                          style={{
                            border: '1px solid var(--mantine-color-gray-3)',
                            borderRadius: 12,
                          }}
                        >
                          <Text size="xs" fw={800} tt="uppercase" c="dimmed" lts="0.08em">
                            Assessment goals
                          </Text>
                          <Stack gap={2} mt={4}>
                            {lessonGoals.map((goal, index) => (
                              <Text key={index} size="sm">
                                • {goal}
                              </Text>
                            ))}
                          </Stack>
                        </Box>
                      )
                    })()}

                    {(() => {
                      const lessonSkillsSelected =
                        lesson.skillIds && lesson.skillIds.length > 0
                          ? skillsForLessons.filter((skill) => lesson.skillIds.includes(skill.id))
                          : skillsForLessons
                      if (lessonSkillsSelected.length === 0) {
                        return null
                      }
                      return (
                        <Box
                          mt="lg"
                          pt="lg"
                          style={{ borderTop: '2px solid var(--mantine-color-gray-9)' }}
                        >
                          <Group gap="lg" align="baseline" wrap="wrap">
                            <Text
                              size="xs"
                              fw={800}
                              tt="uppercase"
                              c="dimmed"
                              lts="0.12em"
                              style={{ flexShrink: 0 }}
                            >
                              Skills assessed
                            </Text>
                            <LessonSkillTiles skills={lessonSkillsSelected} />
                          </Group>
                        </Box>
                      )
                    })()}

                    <Text mt="xl" size="xs" fw={800} tt="uppercase" c="dimmed" lts="0.12em">
                      Session plan
                    </Text>
                    <Table mt="xs" striped verticalSpacing="sm" horizontalSpacing="sm">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Phase / Activity</Table.Th>
                          <Table.Th>Teaching Points</Table.Th>
                          <Table.Th>Organisation</Table.Th>
                          <Table.Th>Mins</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {lessonActivityGroups(lesson, skillsForLessons).flatMap((group) =>
                          group.activities.map((activity, activityIndex) => (
                            <Table.Tr key={activity.id}>
                              <Table.Td>
                                {activityIndex === 0 && (
                                  <Text size="sm" fw={800}>
                                    {group.name}:
                                  </Text>
                                )}
                                <Text size="sm">{activity.name}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">
                                  {activity.successCue || activity.description || '—'}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">
                                  {lessonActivityLeaderLabel(activity.ledBy) ?? 'All together'}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" style={{ whiteSpace: 'nowrap' }}>
                                  {activity.durationMinutes
                                    ? `${activity.durationMinutes} ${activity.durationMinutes === 1 ? 'min' : 'mins'}`
                                    : '—'}
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          ))
                        )}
                      </Table.Tbody>
                    </Table>

                    <Text ta="right" size="sm" mt="xs">
                      Total time: {plannedMinutes} minutes
                    </Text>
                    {lesson.equipment.length > 0 && (
                      <Box
                        mt="md"
                        pt="sm"
                        style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
                      >
                        <Text size="xs" fw={800} tt="uppercase" c="dimmed" lts="0.08em">
                          Equipment
                        </Text>
                        <Group gap="xs" mt="xs">
                          {lesson.equipment.map((item) => (
                            <Badge key={item} variant="default" color="gray" radius="xl">
                              {item}
                            </Badge>
                          ))}
                        </Group>
                      </Box>
                    )}
                    {lesson.isConcluded && (
                      <Box
                        p="sm"
                        mt="sm"
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
                  </Box>
                ) : (
                  <Box
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
                  </Box>
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
                    durationMinutes={lesson.durationMinutes}
                    assessmentGoals={swimmingClass.assessmentGoals}
                    onCancel={() => setEditingLessonId(null)}
                  />
                )}
                {editingActivitiesLessonId === lesson.id && !canEditLesson && (
                  <EditLessonActivitiesForm
                    lesson={lesson}
                    activityBank={activityBank}
                    durationMinutes={lesson.durationMinutes}
                    onCancel={() => setEditingActivitiesLessonId(null)}
                  />
                )}
              </Stack>
            </Card>
          )
        })}

        {focusedLessonId && nextLessons.length > 0 && (
          <Card className="screen-only" padding={0}>
            <Group justify="flex-start" gap="md" p="lg" pb="sm">
              <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.12em">
                Next lessons
              </Text>
              <Text c="dimmed" size="sm">
                {nextLessons.length} remaining · {nextLessonsToPlan} still to plan
              </Text>
            </Group>
            <Box
              style={{
                height: 360,
                overflowY: 'auto',
                padding: '0 24px 12px',
              }}
            >
              <Stack gap={0}>
                {nextLessons.map((lesson) => {
                  const lessonNumber =
                    swimmingClass.lessons.findIndex((item) => item.id === lesson.id) + 1
                  const planned = isLessonPlanned(lesson)
                  const lessonHref = `${urlFor('swimming_classes.show', {
                    id: swimmingClass.id,
                  })}?${planned ? 'lessonId' : 'editLessonId'}=${lesson.id}`

                  return (
                    <Anchor
                      key={lesson.id}
                      component={Link}
                      href={lessonHref}
                      underline="never"
                      style={{ display: 'block', textDecoration: 'none' }}
                    >
                      <Group
                        gap="md"
                        wrap="nowrap"
                        py="sm"
                        style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
                      >
                        <Text c="gray.5" fw={800} w={40} style={{ flexShrink: 0 }}>
                          #{lessonNumber}
                        </Text>
                        <Text c="dimmed" size="sm" w={190} style={{ flexShrink: 0 }}>
                          {lesson.date.formatted}
                        </Text>
                        <Text c="blue.7" fw={600} style={{ flex: 1 }}>
                          {lesson.objectives || 'Add a lesson aim'}
                        </Text>
                        <Text c={planned ? 'teal.7' : 'gray.5'} size="sm" style={{ flexShrink: 0 }}>
                          {planned ? 'Planned' : 'Not planned'}
                        </Text>
                      </Group>
                    </Anchor>
                  )
                })}
              </Stack>
            </Box>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
