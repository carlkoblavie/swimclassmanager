import { Form, Link } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import {
  Avatar,
  Anchor,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Divider,
  Drawer,
  Group,
  Radio,
  ScrollArea,
  SegmentedControl,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { IconCalendar, IconSearch, IconX } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import type { InertiaProps } from '~/types'
import { urlFor } from '~/client'
import { Guard } from '~/utils/permissions'

type EnrolmentClass = {
  id: number
  name: string
  levelId: number
  levelName: string
  stageName: string
  programName: string
  weekday: string | null
  startTime: string | null
  durationMinutes: number
  capacity: number | null
  enrolledCount: number
  placesLeft: number | null
  lessons: { id: number; date: string; label: string }[]
}

type Learner = {
  id: number
  enrollmentId: number
  name: string
  initials: string
  age: number
  guardianName: string
  paymentStatus: 'paid' | 'part_paid'
  level: { id: number; name: string }
  startDate: string | null
  startDateLabel: string | null
  lessonIds: number[]
  class: { id: number; name: string; levelName: string; stageName: string } | null
}

type PageProps = InertiaProps<{
  schoolName: string
  swimYear: { id: number; name: string; termName: string; termStartDate: string } | null
  learners: Learner[]
  classes: EnrolmentClass[]
}>

type LearnerFilter = 'unplaced' | 'enrolled' | 'all'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function classSchedule(swimmingClass: EnrolmentClass) {
  return [swimmingClass.weekday, swimmingClass.startTime].filter(Boolean).join(' · ')
}

function lessonsFromDate(swimmingClass: EnrolmentClass, startDate: string) {
  return swimmingClass.lessons.filter((lesson) => lesson.date >= startDate)
}

function ClassOption({
  swimmingClass,
  learner,
  checked,
  onClick,
}: {
  swimmingClass: EnrolmentClass
  learner: Learner
  checked: boolean
  onClick: () => void
}) {
  const differentLevel = swimmingClass.levelId !== learner.level.id
  const full = swimmingClass.placesLeft !== null && swimmingClass.placesLeft === 0 && !checked

  return (
    <UnstyledButton type="button" onClick={onClick} disabled={full} w="100%">
      <Card
        withBorder
        padding="md"
        radius="md"
        style={{
          borderColor: checked ? 'var(--mantine-color-blue-6)' : undefined,
          opacity: full ? 0.55 : 1,
        }}
      >
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <Radio checked={checked} readOnly aria-label={swimmingClass.name} mt={2} />
          <Box style={{ minWidth: 0, flex: 1 }}>
            <Group justify="space-between" wrap="nowrap" gap="xs">
              <Text fw={800} truncate>
                {swimmingClass.name}
              </Text>
              <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                {full
                  ? 'Full'
                  : swimmingClass.placesLeft === null
                    ? 'Open'
                    : `${swimmingClass.placesLeft} left`}
              </Text>
            </Group>
            <Text size="sm" c="blue.7" mt={3}>
              {swimmingClass.levelName} {'>'} {swimmingClass.stageName}
            </Text>
            <Text size="sm" c="dimmed" mt={2}>
              {classSchedule(swimmingClass) || 'Schedule not set'} · {swimmingClass.durationMinutes}{' '}
              min
              {differentLevel ? ` · different level to ${learner.name}` : ''}
            </Text>
          </Box>
        </Group>
      </Card>
    </UnstyledButton>
  )
}

function PlacementDrawer({
  learner,
  classes,
  startDate,
  opened,
  onClose,
}: {
  learner: Learner | null
  classes: EnrolmentClass[]
  startDate: string
  opened: boolean
  onClose: () => void
}) {
  const currentClass = learner?.class
    ? (classes.find((swimmingClass) => swimmingClass.id === learner.class?.id) ?? null)
    : null
  const initialDate = learner?.startDate ?? startDate
  const initialLessonIds =
    learner?.lessonIds && learner.lessonIds.length > 0
      ? learner.lessonIds
      : currentClass
        ? lessonsFromDate(currentClass, initialDate).map((lesson) => lesson.id)
        : []
  const [classId, setClassId] = useState<string | null>(() =>
    learner?.class ? String(learner.class.id) : null
  )
  const [placementDate, setPlacementDate] = useState(initialDate)
  const [selectedLessonIds, setSelectedLessonIds] = useState<number[]>(initialLessonIds)
  const [lessonsOpen, setLessonsOpen] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  const selectedClass =
    classes.find((swimmingClass) => String(swimmingClass.id) === classId) ?? null
  const selectableLessons = selectedClass ? lessonsFromDate(selectedClass, placementDate) : []

  function chooseClass(nextClassId: string) {
    const nextClass = classes.find((swimmingClass) => String(swimmingClass.id) === nextClassId)
    setClassId(nextClassId)
    setSelectedLessonIds(
      nextClass ? lessonsFromDate(nextClass, placementDate).map((lesson) => lesson.id) : []
    )
    setLessonsOpen(false)
  }

  function changePlacementDate(nextDate: string) {
    setPlacementDate(nextDate)
    if (selectedClass) {
      const availableIds = new Set(
        lessonsFromDate(selectedClass, nextDate).map((lesson) => lesson.id)
      )
      setSelectedLessonIds((current) => current.filter((lessonId) => availableIds.has(lessonId)))
    }
  }

  function withdrawFromClass() {
    if (!learner) {
      return
    }

    setWithdrawing(true)
    router.post(
      urlFor('enrolment.withdraw'),
      { enrollmentId: learner.enrollmentId },
      { onFinish: () => setWithdrawing(false), onSuccess: onClose }
    )
  }

  if (!learner) {
    return null
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={520}
      padding={0}
      withCloseButton={false}
      title={null}
    >
      <Form route="enrolment.place" onSuccess={onClose}>
        {({ processing }) => (
          <Stack gap={0} mih="100%">
            <Group justify="space-between" align="flex-start" p="lg">
              <Group gap="sm" wrap="nowrap">
                <Avatar color="blue" radius="xl" size="lg">
                  {learner.initials}
                </Avatar>
                <Box>
                  <Title order={2} fz="h3">
                    {learner.name}
                  </Title>
                  <Text c="dimmed">
                    {learner.level.name} · age {learner.age} · {learner.guardianName}
                  </Text>
                </Box>
              </Group>
              <Button variant="subtle" color="gray" p={4} onClick={onClose} aria-label="Close">
                <IconX size={20} />
              </Button>
            </Group>
            <Divider />

            <Stack gap="lg" p="lg" style={{ flex: 1 }}>
              {learner.class && (
                <Card withBorder radius="md" padding="md" bg="teal.0">
                  <Group gap="sm" wrap="nowrap" align="flex-start">
                    <Box
                      w={8}
                      h={8}
                      mt={7}
                      style={{
                        flex: '0 0 auto',
                        borderRadius: '50%',
                        backgroundColor: 'var(--mantine-color-teal-6)',
                      }}
                    />
                    <Text c="teal.8" size="sm">
                      Currently in {learner.class.name} · {learner.class.levelName} ·{' '}
                      {learner.class.stageName}
                      {learner.startDateLabel ? `, since ${learner.startDateLabel}.` : '.'}
                    </Text>
                  </Group>
                </Card>
              )}
              <Box>
                <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.14em">
                  {learner.class ? 'Move to' : 'Place in class'}
                </Text>
                <Radio.Group value={classId ?? ''} onChange={chooseClass} mt="sm">
                  <Stack gap="sm">
                    {classes.map((swimmingClass) => {
                      const isSelected = String(swimmingClass.id) === classId

                      return (
                        <Box key={swimmingClass.id}>
                          <ClassOption
                            swimmingClass={swimmingClass}
                            learner={learner}
                            checked={isSelected}
                            onClick={() => chooseClass(String(swimmingClass.id))}
                          />
                          {isSelected && (
                            <Stack
                              gap="sm"
                              mt="sm"
                              p="sm"
                              style={{
                                border: '1px solid var(--mantine-color-gray-3)',
                                borderRadius: 'var(--mantine-radius-md)',
                              }}
                            >
                              <TextInput
                                type="date"
                                label="Joins from"
                                name="startDate"
                                value={placementDate}
                                onChange={(event) => changePlacementDate(event.currentTarget.value)}
                                leftSection={<IconCalendar size={16} />}
                                required
                              />
                              <Text size="sm" c="dimmed">
                                Attendance counts from here.
                              </Text>
                              <Card withBorder padding={0} radius="md">
                                <Group justify="space-between" align="flex-start" p="md">
                                  <Box>
                                    <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.14em">
                                      Lessons
                                    </Text>
                                    <Text size="sm" c="dimmed" mt={3}>
                                      {selectableLessons.length > 0
                                        ? `All ${selectableLessons.length} lessons from ${placementDate}`
                                        : 'No lessons planned from this date'}
                                    </Text>
                                  </Box>
                                  <Button
                                    variant="subtle"
                                    size="sm"
                                    onClick={() => setLessonsOpen((current) => !current)}
                                  >
                                    {lessonsOpen ? 'Done' : 'Choose lessons'}
                                  </Button>
                                </Group>
                                {lessonsOpen && selectableLessons.length > 0 && (
                                  <Stack gap={0}>
                                    {selectableLessons.map((lesson) => (
                                      <Checkbox
                                        key={lesson.id}
                                        p="md"
                                        checked={selectedLessonIds.includes(lesson.id)}
                                        onChange={(event) => {
                                          const checked = event.currentTarget.checked
                                          setSelectedLessonIds((current) =>
                                            checked
                                              ? [...current, lesson.id]
                                              : current.filter((id) => id !== lesson.id)
                                          )
                                        }}
                                        label={`${lesson.label} · ${swimmingClass.startTime ?? 'Time not set'}`}
                                        styles={{
                                          root: {
                                            borderTop: '1px solid var(--mantine-color-gray-2)',
                                          },
                                        }}
                                      />
                                    ))}
                                  </Stack>
                                )}
                              </Card>
                              <Group grow>
                                <Button variant="default" onClick={onClose}>
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={
                                    !classId || !placementDate || selectedLessonIds.length === 0
                                  }
                                  loading={processing}
                                >
                                  {learner.class
                                    ? 'Save changes'
                                    : `Enrol into ${selectedLessonIds.length || 0} lessons`}
                                </Button>
                              </Group>
                              {learner.class && (
                                <Guard for="enrolment.withdraw">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    color="red"
                                    loading={withdrawing}
                                    onClick={withdrawFromClass}
                                  >
                                    Withdraw from class
                                  </Button>
                                </Guard>
                              )}
                            </Stack>
                          )}
                        </Box>
                      )
                    })}
                  </Stack>
                </Radio.Group>
              </Box>
              <input type="hidden" name="learnerIds[]" value={learner.id} />
              <input type="hidden" name="swimmingClassId" value={classId ?? ''} />
              {selectedLessonIds.map((lessonId) => (
                <input key={lessonId} type="hidden" name="lessonIds[]" value={lessonId} />
              ))}
            </Stack>
          </Stack>
        )}
      </Form>
    </Drawer>
  )
}

export default function EnrolmentIndex({ schoolName, swimYear, learners, classes }: PageProps) {
  const defaultDate = swimYear?.termStartDate ?? todayIso()
  const [filter, setFilter] = useState<LearnerFilter>('unplaced')
  const [search, setSearch] = useState('')
  const [levelId, setLevelId] = useState('all')
  const [drawerLearnerId, setDrawerLearnerId] = useState<number | null>(null)

  const levelOptions = useMemo(
    () => [
      { value: 'all', label: 'All levels' },
      ...[...new Map(learners.map((learner) => [learner.level.id, learner.level.name]))]
        .sort(([, first], [, second]) => first.localeCompare(second))
        .map(([value, label]) => ({ value: String(value), label })),
    ],
    [learners]
  )

  const filteredLearners = useMemo(() => {
    const query = search.trim().toLowerCase()
    return learners.filter((learner) => {
      const statusMatches =
        filter === 'all' ||
        (filter === 'enrolled' ? learner.class !== null : learner.class === null)
      const levelMatches = levelId === 'all' || String(learner.level.id) === levelId
      const searchMatches =
        !query || `${learner.name} ${learner.guardianName}`.toLowerCase().includes(query)
      return statusMatches && levelMatches && searchMatches
    })
  }, [filter, learners, levelId, search])

  const drawerLearner = learners.find((learner) => learner.id === drawerLearnerId) ?? null

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Box>
            <Text size="xs" tt="uppercase" fw={800} c="dimmed" lts="0.14em">
              {schoolName} ·{' '}
              {swimYear ? `${swimYear.name} · ${swimYear.termName}` : 'No active term'}
            </Text>
            <Title order={1} mt={4}>
              Enrolment
            </Title>
            <Text c="dimmed" maw={760} mt={4}>
              Place paid or part-paid learners into a class and choose the lessons they will attend.
            </Text>
          </Box>
          <Group gap="lg" align="flex-start">
            <Box ta="right">
              <Text fw={800} fz="lg" lh={1}>
                {learners.filter((learner) => learner.class !== null).length}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                enrolled
              </Text>
            </Box>
            <Box ta="right">
              <Text fw={800} fz="lg" lh={1}>
                {learners.filter((learner) => learner.class === null).length}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                awaiting class
              </Text>
            </Box>
          </Group>
        </Group>

        <Group justify="space-between" align="center" gap="md">
          <SegmentedControl
            value={filter}
            onChange={(value) => setFilter(value as LearnerFilter)}
            data={[
              {
                value: 'unplaced',
                label: `Unplaced (${learners.filter((learner) => !learner.class).length})`,
              },
              {
                value: 'enrolled',
                label: `Enrolled (${learners.filter((learner) => learner.class).length})`,
              },
              { value: 'all', label: `All (${learners.length})` },
            ]}
          />
          <Group gap="sm" style={{ flex: 1, justifyContent: 'flex-end' }} wrap="nowrap">
            <TextInput
              maw={380}
              radius="md"
              leftSection={<IconSearch size={18} />}
              placeholder="Search learners"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
            <Select
              radius="md"
              data={levelOptions}
              value={levelId}
              onChange={(value) => setLevelId(value ?? 'all')}
            />
          </Group>
        </Group>

        <Card withBorder shadow="sm" padding={0} radius="md" style={{ overflow: 'hidden' }}>
          <ScrollArea type="auto">
            <Table
              horizontalSpacing="xl"
              verticalSpacing="md"
              miw={760}
              styles={{
                th: {
                  backgroundColor: 'var(--mantine-color-gray-0)',
                  color: 'var(--mantine-color-dimmed)',
                  fontSize: 'var(--mantine-font-size-xs)',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                },
                td: {
                  borderTop: '1px solid var(--mantine-color-gray-2)',
                },
              }}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Learner</Table.Th>
                  <Table.Th>Level</Table.Th>
                  <Table.Th>Class</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th ta="right">Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredLearners.map((learner) => {
                  const unplaced = learner.class === null
                  const canPlace =
                    learner.paymentStatus === 'paid' || learner.paymentStatus === 'part_paid'
                  return (
                    <Table.Tr key={learner.id}>
                      <Table.Td>
                        <Group gap="sm" wrap="nowrap">
                          <Avatar color="blue" variant="light" radius="xl">
                            {learner.initials}
                          </Avatar>
                          <Box>
                            <Anchor
                              component={Link}
                              href={urlFor('learners.show', { id: learner.id })}
                              fw={800}
                              lh={1.2}
                            >
                              {learner.name}
                            </Anchor>
                            <Text size="sm" c="dimmed" mt={3}>
                              Age {learner.age} · {learner.guardianName}
                            </Text>
                          </Box>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600}>{learner.level.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        {learner.class ? (
                          <Stack gap={2}>
                            <Text fw={700}>{learner.class.name}</Text>
                            <Text size="xs" c="dimmed">
                              {learner.class.levelName} {'>'} {learner.class.stageName}
                            </Text>
                          </Stack>
                        ) : (
                          <Text c="dimmed">Not placed</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <Box
                            w={7}
                            h={7}
                            style={{
                              flex: '0 0 auto',
                              borderRadius: '50%',
                              backgroundColor: learner.class
                                ? 'var(--mantine-color-teal-6)'
                                : learner.paymentStatus === 'part_paid'
                                  ? 'var(--mantine-color-orange-6)'
                                  : 'var(--mantine-color-yellow-6)',
                            }}
                          />
                          <Text
                            c={
                              learner.class
                                ? 'teal.7'
                                : learner.paymentStatus === 'part_paid'
                                  ? 'orange.7'
                                  : 'yellow.8'
                            }
                            fw={700}
                            size="sm"
                          >
                            {learner.class
                              ? 'Enrolled'
                              : learner.paymentStatus === 'part_paid'
                                ? 'Part paid'
                                : 'Awaiting class'}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Guard for="enrolment.place">
                          {learner.class && (
                            <Button
                              variant="subtle"
                              color="blue"
                              size="sm"
                              onClick={() => setDrawerLearnerId(learner.id)}
                            >
                              Edit
                            </Button>
                          )}
                          {unplaced && canPlace && (
                            <Button
                              variant="light"
                              color="blue"
                              radius="md"
                              size="sm"
                              onClick={() => {
                                setDrawerLearnerId(learner.id)
                              }}
                            >
                              Enrol
                            </Button>
                          )}
                        </Guard>
                        {unplaced && !canPlace && (
                          <Text size="sm" c="dimmed">
                            Payment due
                          </Text>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
          {filteredLearners.length === 0 && (
            <Text c="dimmed" ta="center" py="xl">
              No learners match these filters.
            </Text>
          )}
        </Card>
      </Stack>

      <PlacementDrawer
        key={drawerLearnerId ?? 'closed'}
        learner={drawerLearner}
        classes={classes}
        startDate={defaultDate}
        opened={drawerLearner !== null}
        onClose={() => setDrawerLearnerId(null)}
      />
    </Container>
  )
}
