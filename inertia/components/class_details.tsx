import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Anchor,
  Badge,
  Box,
  Button,
  Collapse,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import { IconArrowRight, IconChevronDown } from '@tabler/icons-react'
import { Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import { urlFor } from '~/client'
import { Guard } from '~/utils/permissions'

function MetaCell({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <Box p="sm" style={{ minWidth: 0 }}>
      <Text size="xs" tt="uppercase" c="gray.6" fw={800} lts="0.1em">
        {label}
      </Text>
      <Text fw={800} fz="lg" mt={6} truncate>
        {value}
      </Text>
      {note && (
        <Text c="dimmed" size="sm" mt={2} truncate>
          {note}
        </Text>
      )}
    </Box>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Text size="xs" tt="uppercase" c="blue.7" fw={800} lts="0.1em">
      {children}
    </Text>
  )
}

function termLabel(swimmingClass: Data.SwimmingClass) {
  const term = swimmingClass.term
  if (!term) {
    return { value: 'Not set', note: undefined }
  }

  return {
    value: term.name,
    note: `${term.swimYearName ? `${term.swimYearName} · ` : ''}${term.startsOn.formatted} – ${term.endsOn.formatted}`,
  }
}

function lessonRange(swimmingClass: Data.SwimmingClass) {
  const lessons = swimmingClass.lessons
  if (lessons.length === 0) {
    return { count: 0, value: '0', note: 'No lessons yet' }
  }

  const first = lessons[0]
  const last = lessons[lessons.length - 1]
  return {
    count: lessons.length,
    value: String(lessons.length),
    note:
      first.id === last.id
        ? first.date.formatted
        : `${first.date.formatted} – ${last.date.formatted}`,
  }
}

function lessonInstructorSummary(swimmingClass: Data.SwimmingClass) {
  const lead = [
    ...new Set(
      swimmingClass.lessons
        .map((lesson) => lesson.leadInstructor?.label)
        .filter((label): label is string => Boolean(label))
    ),
  ]
  const supporting = [
    ...new Set(
      swimmingClass.lessons.flatMap((lesson) =>
        lesson.supportingInstructors.map((instructor) => instructor.label)
      )
    ),
  ]

  if (lead.length === 0 && supporting.length === 0) {
    return null
  }

  return [
    lead.length > 0 ? `Lead ${lead.join(', ')}` : null,
    supporting.length > 0 ? `supporting ${supporting.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

export default function ClassDetails({
  swimmingClass,
  rightAction,
  displayName,
}: {
  swimmingClass: Data.SwimmingClass
  rightAction?: ReactNode
  displayName?: string
}) {
  const [open, setOpen] = useState(false)
  const prerequisite = swimmingClass.prerequisiteStage
  const prerequisiteLabel = prerequisite
    ? `${prerequisite.level?.name ? `${prerequisite.level.name} - ` : ''}${prerequisite.name}`
    : 'None'
  const term = termLabel(swimmingClass)
  const lessons = lessonRange(swimmingClass)
  const lessonInstructors = lessonInstructorSummary(swimmingClass)

  return (
    <Box mt="sm">
      <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
        <Group gap="xs" wrap="wrap">
          <Text fw={800} fz="lg">
            {displayName ?? swimmingClass.name}
          </Text>
          <Badge variant="light" color="gray" size="sm">
            {swimmingClass.code}
          </Badge>
          {swimmingClass.isCancelled && (
            <Badge variant="light" color="red" size="sm">
              Cancelled
            </Badge>
          )}
        </Group>
        {rightAction}
      </Group>
      <Text c="dimmed" size="sm" mt={4}>
        {typeof swimmingClass.durationMinutes === 'number'
          ? `${swimmingClass.durationMinutes} min`
          : 'Duration not set'}{' '}
        · {lessons.value} {lessons.count === 1 ? 'lesson' : 'lessons'} · {lessons.note}
      </Text>
      {swimmingClass.aim && (
        <Group gap="xs" mt="sm" wrap="nowrap" align="flex-start">
          <Text c="yellow.7" fw={800} lh={1.4}>
            •
          </Text>
          <Text size="sm" c="gray.7">
            {swimmingClass.aim}
          </Text>
        </Group>
      )}
      <Button
        type="button"
        variant="subtle"
        color="blue"
        size="compact-sm"
        px={0}
        mt="sm"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen((current) => !current)
        }}
        rightSection={
          <IconChevronDown
            size={15}
            style={{
              transform: open ? 'rotate(180deg)' : undefined,
              transition: 'transform 150ms ease',
            }}
          />
        }
      >
        {open ? 'Hide details' : 'View details'}
      </Button>

      <Collapse expanded={open}>
        <Box mt="xs" style={{ border: '1px solid var(--mantine-color-gray-2)' }}>
          <SimpleGrid
            cols={{ base: 1, xs: 2, sm: 4 }}
            spacing={0}
            style={{ background: 'var(--mantine-color-gray-0)' }}
          >
            <MetaCell
              label="Duration"
              value={
                typeof swimmingClass.durationMinutes === 'number'
                  ? `${swimmingClass.durationMinutes} min`
                  : 'Not set'
              }
              note="per lesson"
            />
            <MetaCell
              label="Lessons"
              value={`${lessons.value} / ${swimmingClass.maxLessons}`}
              note={lessons.note}
            />
            <MetaCell label="Term" value={term.value} note={term.note} />
            <MetaCell
              label="Skills"
              value={swimmingClass.skills.length}
              note={`${swimmingClass.skills.length === 1 ? 'skill' : 'skills'} covered`}
            />
          </SimpleGrid>

          <Box p={{ base: 'sm', sm: 'md' }}>
            <SectionLabel>Main objective</SectionLabel>
            <Text fw={800} fz={{ base: 'lg', sm: 'xl' }} mt="sm">
              {swimmingClass.aim || 'Not set'}
            </Text>
          </Box>

          <Divider />

          <Group p={{ base: 'sm', sm: 'md' }} gap="xs" wrap="wrap">
            <Text size="xs" tt="uppercase" c="gray.6" fw={800} lts="0.1em">
              Entry
            </Text>
            <Text c="yellow.8" fw={700}>
              ●
            </Text>
            <Text c="yellow.8" fw={600}>
              {prerequisite ? `Must have cleared ${prerequisiteLabel}` : 'No pre-requisite'}
            </Text>
          </Group>

          <Divider />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={0}>
            <Box p={{ base: 'sm', sm: 'md' }}>
              <Group justify="space-between" align="baseline" mb="sm">
                <SectionLabel>Assessment goals</SectionLabel>
                <Text c="dimmed" size="sm">
                  {swimmingClass.assessmentGoals.length}{' '}
                  {swimmingClass.assessmentGoals.length === 1 ? 'goal' : 'goals'}
                </Text>
              </Group>
              {swimmingClass.assessmentGoals.length > 0 ? (
                <Stack gap="xs">
                  {swimmingClass.assessmentGoals.map((goal, index) => (
                    <Group key={`${goal}-${index}`} gap="xs" wrap="nowrap" align="flex-start">
                      <Box
                        bg="gray.1"
                        c="gray.7"
                        w={28}
                        h={28}
                        style={{
                          borderRadius: 8,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Text fw={800}>{index + 1}</Text>
                      </Box>
                      <Text size="sm" pt={4}>
                        {goal}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              ) : (
                <Text c="dimmed" size="sm">
                  No assessment goals set.
                </Text>
              )}
            </Box>

            <Box
              p={{ base: 'sm', sm: 'md' }}
              style={{ borderLeft: '1px solid var(--mantine-color-gray-2)' }}
            >
              <Group justify="space-between" align="baseline" mb="sm">
                <SectionLabel>Skills covered</SectionLabel>
                <Text c="dimmed" size="sm">
                  {swimmingClass.skills.length} total
                </Text>
              </Group>
              {swimmingClass.skills.length > 0 ? (
                <Group gap="xs">
                  {swimmingClass.skills.map((skill) => (
                    <Box
                      key={skill.id}
                      px="sm"
                      py={6}
                      style={{
                        border: '1px solid var(--mantine-color-gray-2)',
                        borderRadius: 999,
                        background: 'var(--mantine-color-gray-0)',
                      }}
                    >
                      <Text size="sm" c="gray.7">
                        <Text span c="blue.5" mr={6}>
                          •
                        </Text>
                        {skill.name}
                      </Text>
                    </Box>
                  ))}
                </Group>
              ) : (
                <Text c="dimmed" size="sm">
                  No skills selected.
                </Text>
              )}
            </Box>
          </SimpleGrid>

          <Divider />

          <Box p={{ base: 'sm', sm: 'md' }}>
            <Group justify="space-between" align="flex-end" gap="md">
              <Box>
                <Text fw={800}>
                  {lessons.count} {lessons.count === 1 ? 'lesson' : 'lessons'}
                </Text>
                {lessonInstructors && (
                  <Text c="dimmed" size="sm" mt={4}>
                    {lessonInstructors}
                  </Text>
                )}
              </Box>
            </Group>
            <Group justify="flex-end" mt="md">
              {swimmingClass.lessons.length > 0 ? (
                <Anchor
                  component={Link}
                  href={urlFor('lessons.index', [], { qs: { classId: swimmingClass.id } })}
                  fw={700}
                >
                  View lessons <IconArrowRight size={15} style={{ verticalAlign: 'middle' }} />
                </Anchor>
              ) : (
                <Guard for="lesson.generate">
                  <Anchor
                    component={Link}
                    href={urlFor('lessons.index', [], {
                      qs: { classId: swimmingClass.id, generate: '1' },
                    })}
                    fw={700}
                  >
                    Generate lessons{' '}
                    <IconArrowRight size={15} style={{ verticalAlign: 'middle' }} />
                  </Anchor>
                </Guard>
              )}
            </Group>
          </Box>
        </Box>
      </Collapse>
    </Box>
  )
}
