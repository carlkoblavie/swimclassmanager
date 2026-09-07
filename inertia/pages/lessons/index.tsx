import { useEffect, useMemo, useState } from 'react'
import { usePage } from '@inertiajs/react'
import { Form, Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  LoadingOverlay,
  NativeSelect,
  Paper,
  Radio,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import {
  IconAdjustments,
  IconCalendar,
  IconChevronDown,
  IconClock,
  IconCopy,
  IconList,
  IconLock,
  IconPencil,
  IconX,
} from '@tabler/icons-react'
import { urlFor } from '~/client'
import type { InertiaProps } from '~/types'
import EditLessonInstructorsDrawer from '~/components/edit_lesson_instructors_drawer'
import BulkAssignLessonInstructorsDrawer from '~/components/bulk_assign_lesson_instructors_drawer'
import { Guard } from '~/utils/permissions'

type PageProps = InertiaProps<{
  classes: Data.SwimmingClass[]
  instructorOptions: Data.Membership[]
  pendingInstructorOptions: Data.Invitation[]
  selectedClassId: number | null
  showGenerator: boolean
}>

type ActivityFilter = 'all' | 'with-activities' | 'without-activities'

type LessonFilters = {
  levelId: string
  stageId: string
  classId: string
  instructorId: string
  startDate: string
  endDate: string
  activityStatus: ActivityFilter
}

const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
]

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }
  return new Date(Date.UTC(year, month - 1, day))
}

function countLessons(startDate: string, endDate: string, weekdays: number[]) {
  const start = parseIsoDate(startDate)
  const end = parseIsoDate(endDate)
  if (!start || !end || end < start || weekdays.length === 0) {
    return 0
  }

  const allowed = new Set(weekdays)
  let cursor = start
  let count = 0
  while (cursor <= end) {
    const day = cursor.getUTCDay() === 0 ? 7 : cursor.getUTCDay()
    if (allowed.has(day)) {
      count += 1
    }
    cursor = addDays(cursor, 1)
  }
  return count
}

function endTime(startTime: string, durationMinutes: number | null) {
  const [hours, minutes] = startTime.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !durationMinutes) {
    return null
  }
  const total = hours * 60 + minutes + durationMinutes
  const endHours = Math.floor((total % (24 * 60)) / 60)
  const endMinutes = total % 60
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
}

function formatClock(value: string | null | undefined) {
  if (!value) {
    return null
  }
  const [hours, minutes] = value.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value
  }
  const period = hours >= 12 ? 'pm' : 'am'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
}

function lessonSummary(swimmingClass: Data.SwimmingClass) {
  const count = swimmingClass.lessons.length
  const label = count === 1 ? 'lesson' : 'lessons'
  return swimmingClass.maxLessons
    ? `${count} / ${swimmingClass.maxLessons} ${label}`
    : `${count} ${label}`
}

function classLabel(swimmingClass: Data.SwimmingClass) {
  return [swimmingClass.level?.programName, swimmingClass.level?.name, swimmingClass.stage?.name]
    .filter(Boolean)
    .join(' · ')
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const SHORT_MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function monthLabel(rawDate: string) {
  const date = parseIsoDate(rawDate)
  if (!date) {
    return 'Scheduled lessons'
  }
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`.toUpperCase()
}

function lessonDateLabel(rawDate: string) {
  const date = parseIsoDate(rawDate)
  if (!date) {
    return rawDate
  }
  return `${WEEKDAY_NAMES[date.getUTCDay()]} ${date.getUTCDate()} ${SHORT_MONTH_NAMES[date.getUTCMonth()]}`
}

function groupedLessons(lessons: Data.SwimmingClass['lessons']) {
  const groups = new Map<string, Data.SwimmingClass['lessons']>()
  for (const lesson of lessons) {
    const label = monthLabel(lesson.date.raw)
    groups.set(label, [...(groups.get(label) ?? []), lesson])
  }
  return [...groups.entries()]
}

function levelOptionsFor(classes: Data.SwimmingClass[]) {
  const levels = new Map<number, string>()
  for (const swimmingClass of classes) {
    if (swimmingClass.level) {
      levels.set(swimmingClass.level.id, swimmingClass.level.name)
    }
  }
  return [...levels.entries()]
    .map(([id, name]) => ({ value: String(id), label: name }))
    .toSorted((a, b) => a.label.localeCompare(b.label))
}

function stageOptionsFor(classes: Data.SwimmingClass[], levelId: string) {
  const stages = new Map<number, string>()
  for (const swimmingClass of classes) {
    if (String(swimmingClass.levelId) !== levelId) {
      continue
    }
    if (swimmingClass.stage) {
      stages.set(swimmingClass.stage.id, swimmingClass.stage.name)
    }
  }
  return [...stages.entries()]
    .map(([id, name]) => ({ value: String(id), label: name }))
    .toSorted((a, b) => a.label.localeCompare(b.label))
}

export default function LessonsIndex({
  classes,
  instructorOptions,
  pendingInstructorOptions,
  selectedClassId,
  showGenerator: initialShowGenerator,
}: PageProps) {
  const { props } = usePage()
  const userPermissions = (props.userPermissions as string[] | undefined) ?? []
  const activeRole = props.activeRole as string | undefined
  const canGenerateLessons = userPermissions.includes('lesson.generate')
  const canFilterByInstructor = userPermissions.includes('lesson.instructors.manage')
  const canBulkAssignInstructors = userPermissions.includes('lesson.instructors.bulk_manage')
  const isInstructorView = activeRole === 'Teacher' || activeRole === 'Assistant Coach'
  const canShowLessonSelection = canBulkAssignInstructors || isInstructorView
  const lockedClass = selectedClassId
    ? classes.find((swimmingClass) => swimmingClass.id === selectedClassId)
    : undefined
  const initialLevelId = String(lockedClass?.levelId ?? levelOptionsFor(classes)[0]?.value ?? '')
  const initialStageId = initialLevelId
    ? String(lockedClass?.levelStageId ?? stageOptionsFor(classes, initialLevelId)[0]?.value ?? '')
    : ''
  const initialClassId = String(lockedClass?.id ?? classes[0]?.id ?? '')
  const instructorFilterOptions = useMemo(
    () => [
      { value: '', label: 'All instructors' },
      ...instructorOptions.map((member) => ({
        value: `membership:${member.id}`,
        label: member.label,
      })),
      ...pendingInstructorOptions.map((invitation) => ({
        value: `invitation:${invitation.id}`,
        label: `${invitation.label} · invited`,
      })),
    ],
    [instructorOptions, pendingInstructorOptions]
  )
  const bulkInstructorOptions = useMemo(
    () => [
      ...instructorOptions.map((member) => ({
        value: `membership:${member.id}`,
        label: member.label,
      })),
      ...pendingInstructorOptions.map((invitation) => ({
        value: `invitation:${invitation.id}`,
        label: `${invitation.label} · invited`,
      })),
    ],
    [instructorOptions, pendingInstructorOptions]
  )
  const [classId, setClassId] = useState(initialClassId)
  const [levelFilter, setLevelFilter] = useState(initialLevelId)
  const [stageFilter, setStageFilter] = useState(initialStageId)
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [filterInstructorId, setFilterInstructorId] = useState('')
  const [filterActivityStatus, setFilterActivityStatus] = useState<ActivityFilter>('all')
  const [appliedFilters, setAppliedFilters] = useState<LessonFilters>({
    levelId: initialLevelId,
    stageId: initialStageId,
    classId: initialClassId,
    instructorId: '',
    startDate: '',
    endDate: '',
    activityStatus: 'all',
  })
  const [startDate, setStartDate] = useState(todayIso())
  const [endDate, setEndDate] = useState(isoDate(addDays(new Date(), 84)))
  const [startTime, setStartTime] = useState('17:00')
  const [weekdays, setWeekdays] = useState<number[]>([4])
  const [copySourceLessonId, setCopySourceLessonId] = useState<number | null>(null)
  const [copyTargetLessonIds, setCopyTargetLessonIds] = useState<number[]>([])
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null)
  const [selectedLessonIds, setSelectedLessonIds] = useState<number[]>([])
  const [bulkAssignmentOpened, setBulkAssignmentOpened] = useState(false)
  const levelOptions = useMemo(() => levelOptionsFor(classes), [classes])
  const stageOptions = useMemo(() => stageOptionsFor(classes, levelFilter), [classes, levelFilter])
  const visibleClasses = useMemo(
    () =>
      classes.filter(
        (swimmingClass) =>
          String(swimmingClass.levelId) === levelFilter &&
          String(swimmingClass.levelStageId) === stageFilter
      ),
    [classes, levelFilter, stageFilter]
  )
  const selectedClass = classes.find(
    (swimmingClass) => String(swimmingClass.id) === appliedFilters.classId
  )
  const copyTargetLessons = selectedClass
    ? classes.flatMap((swimmingClass) =>
        swimmingClass.levelStageId === selectedClass.levelStageId
          ? swimmingClass.lessons
              .filter((lesson) => lesson.activities.length === 0)
              .map((lesson) => ({ lesson, swimmingClass }))
          : []
      )
    : []
  const generationClass =
    lockedClass ??
    classes.find((swimmingClass) => String(swimmingClass.id) === classId) ??
    selectedClass
  const [showGenerator, setShowGenerator] = useState(() => initialShowGenerator)

  useEffect(() => {
    if (lockedClass) {
      return
    }
    if (levelOptions.length === 0 && levelFilter !== '') {
      setLevelFilter('')
      return
    }
    if (levelOptions.length > 0 && !levelOptions.some((option) => option.value === levelFilter)) {
      setLevelFilter(levelOptions[0].value)
    }
  }, [levelFilter, levelOptions, lockedClass])

  useEffect(() => {
    if (lockedClass) {
      return
    }
    if (stageOptions.length === 0 && stageFilter !== '') {
      setStageFilter('')
      return
    }
    if (stageOptions.length > 0 && !stageOptions.some((option) => option.value === stageFilter)) {
      setStageFilter(stageOptions[0].value)
    }
  }, [lockedClass, stageFilter, stageOptions])

  useEffect(() => {
    if (lockedClass) {
      return
    }
    if (!visibleClasses.some((swimmingClass) => String(swimmingClass.id) === classId)) {
      setClassId(String(visibleClasses[0]?.id ?? ''))
    }
  }, [classId, lockedClass, visibleClasses])

  useEffect(() => {
    setShowGenerator(initialShowGenerator)
  }, [initialShowGenerator])

  const filteredLessons = useMemo(() => {
    if (!selectedClass) {
      return []
    }

    return selectedClass.lessons.filter((lesson) => {
      if (appliedFilters.startDate && lesson.date.raw < appliedFilters.startDate) {
        return false
      }
      if (appliedFilters.endDate && lesson.date.raw > appliedFilters.endDate) {
        return false
      }
      if (
        appliedFilters.instructorId &&
        !lesson.instructors.some(
          (instructor) => `${instructor.type}:${instructor.id}` === appliedFilters.instructorId
        )
      ) {
        return false
      }
      if (appliedFilters.activityStatus === 'with-activities' && lesson.activities.length === 0) {
        return false
      }
      if (appliedFilters.activityStatus === 'without-activities' && lesson.activities.length > 0) {
        return false
      }
      return true
    })
  }, [appliedFilters, selectedClass])

  const applyFilters = () => {
    setAppliedFilters({
      levelId: levelFilter,
      stageId: stageFilter,
      classId,
      instructorId: filterInstructorId,
      startDate: filterStartDate,
      endDate: filterEndDate,
      activityStatus: filterActivityStatus,
    })
    setSelectedLessonIds([])
    setShowGenerator(false)
  }

  const clearFilters = () => {
    setLevelFilter(initialLevelId)
    setStageFilter(initialStageId)
    setClassId(initialClassId)
    setFilterStartDate('')
    setFilterEndDate('')
    setFilterInstructorId('')
    setFilterActivityStatus('all')
    setAppliedFilters({
      levelId: initialLevelId,
      stageId: initialStageId,
      classId: initialClassId,
      instructorId: '',
      startDate: '',
      endDate: '',
      activityStatus: 'all',
    })
    setSelectedLessonIds([])
  }

  const openCopyActivities = (lessonId: number) => {
    setCopySourceLessonId(lessonId)
    setCopyTargetLessonIds([])
  }

  const toggleCopyTarget = (lessonId: number) => {
    setCopyTargetLessonIds((current) =>
      current.includes(lessonId) ? current.filter((id) => id !== lessonId) : [...current, lessonId]
    )
  }

  const toggleAllEmptyCopyTargets = () => {
    const emptyLessonIds = copyTargetLessons.map(({ lesson }) => lesson.id)
    setCopyTargetLessonIds((current) =>
      current.length === emptyLessonIds.length ? [] : emptyLessonIds
    )
  }

  const lessonCount = useMemo(
    () => countLessons(startDate, endDate, weekdays),
    [startDate, endDate, weekdays]
  )
  const classLessonCount = generationClass?.lessons.length ?? 0
  const classMaxLessons = generationClass?.maxLessons ?? null
  const classLessonsRemaining =
    typeof classMaxLessons === 'number'
      ? Math.max(classMaxLessons - classLessonCount, 0)
      : null
  const exceedsClassAllowance =
    classLessonsRemaining !== null && lessonCount > classLessonsRemaining
  const endsAt = endTime(startTime, generationClass?.durationMinutes ?? null)
  const scheduledStart = selectedClass?.startTime?.raw ?? startTime
  const editingLesson =
    selectedClass?.lessons.find((lesson) => lesson.id === editingLessonId) ?? null

  const toggleLessonSelection = (lessonId: number) => {
    setSelectedLessonIds((current) =>
      current.includes(lessonId) ? current.filter((id) => id !== lessonId) : [...current, lessonId]
    )
  }

  const toggleMonthSelection = (lessonIds: number[]) => {
    setSelectedLessonIds((current) => {
      const allSelected = lessonIds.every((lessonId) => current.includes(lessonId))
      return allSelected
        ? current.filter((lessonId) => !lessonIds.includes(lessonId))
        : [...new Set([...current, ...lessonIds])]
    })
  }

  const toggleWeekday = (weekday: number) =>
    setWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((candidate) => candidate !== weekday)
        : [...current, weekday].toSorted()
    )

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="xs" tt="uppercase" c="dimmed" fw={700} lts="0.16em">
              Lessons
            </Text>
            <Title order={1}>Lessons</Title>
            <Text c="dimmed" size="sm" maw={720}>
              Review lessons by class, date range, and activity status.
            </Text>
          </div>
        </Group>

        {classes.length === 0 ? (
          <Card withBorder shadow="none" radius="md">
            <Text fw={700}>
              {canGenerateLessons ? 'No classes available' : 'No lessons assigned to you yet'}
            </Text>
            <Text c="dimmed" size="sm">
              {canGenerateLessons
                ? 'Create a class before generating lessons.'
                : 'Lessons assigned to you will appear here.'}
            </Text>
          </Card>
        ) : showGenerator ? (
          <Guard for="lesson.generate">
            <Form route="lessons.store">
              {({ processing }) => (
                <Card withBorder shadow="sm" padding={0} radius="md" pos="relative">
                  <LoadingOverlay
                    visible={processing}
                    zIndex={10}
                    overlayProps={{ radius: 'md', blur: 2 }}
                    loaderProps={{ children: 'Generating lessons...' }}
                  />
                  <input type="hidden" name="classId" value={generationClass?.id ?? ''} />
                  <input type="hidden" name="startDate" value={startDate} />
                  <input type="hidden" name="endDate" value={endDate} />
                  <input type="hidden" name="startTime" value={startTime} />
                  {weekdays.map((weekday, index) => (
                    <input
                      key={weekday}
                      type="hidden"
                      name={`weekdays[${index}]`}
                      value={weekday}
                    />
                  ))}

                  <Stack gap={0}>
                    <Box p="lg">
                      <Text fw={800} mb="sm">
                        Class
                      </Text>
                      {lockedClass ? (
                        <Card withBorder radius="md" padding="md">
                          <Group gap="sm" wrap="nowrap">
                            <ThemeIcon variant="light" radius="xl">
                              <IconLock size={16} />
                            </ThemeIcon>
                            <Box style={{ minWidth: 0, flex: 1 }}>
                              <Text fw={800}>{lockedClass.name}</Text>
                              <Text size="sm" c="dimmed">
                                {classLabel(lockedClass)} · {lockedClass.skills.length}{' '}
                                {lockedClass.skills.length === 1 ? 'skill' : 'skills'} ·{' '}
                                {lockedClass.durationMinutes} min
                              </Text>
                            </Box>
                            <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                              {lessonSummary(lockedClass)}
                            </Text>
                          </Group>
                        </Card>
                      ) : (
                        <Radio.Group value={classId} onChange={setClassId} name="visibleClassId">
                          <Stack gap="xs">
                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                              <NativeSelect
                                label="Filter by level"
                                value={levelFilter}
                                onChange={(event) => {
                                  const nextLevelId = event.currentTarget.value
                                  setLevelFilter(nextLevelId)
                                  setStageFilter(
                                    stageOptionsFor(classes, nextLevelId)[0]?.value ?? ''
                                  )
                                }}
                                data={levelOptions}
                              />
                              <NativeSelect
                                label="Filter by stage"
                                value={stageFilter}
                                onChange={(event) => setStageFilter(event.currentTarget.value)}
                                data={stageOptions}
                              />
                            </SimpleGrid>

                            {visibleClasses.length === 0 ? (
                              <Text size="sm" c="dimmed">
                                No classes match the selected filters.
                              </Text>
                            ) : (
                              visibleClasses.map((swimmingClass) => (
                                <UnstyledButton
                                  key={swimmingClass.id}
                                  type="button"
                                  onClick={() => setClassId(String(swimmingClass.id))}
                                >
                                  <Card
                                    withBorder
                                    radius="md"
                                    padding="md"
                                    style={{
                                      borderColor:
                                        String(swimmingClass.id) === classId
                                          ? 'var(--mantine-color-blue-5)'
                                          : undefined,
                                    }}
                                  >
                                    <Group gap="sm" wrap="nowrap">
                                      <Radio
                                        value={String(swimmingClass.id)}
                                        aria-label={swimmingClass.name}
                                      />
                                      <Badge variant="dot" color="aqua">
                                        {swimmingClass.stage?.name ?? 'Class'}
                                      </Badge>
                                      <Box style={{ minWidth: 0, flex: 1 }}>
                                        <Text fw={800}>{swimmingClass.name}</Text>
                                      </Box>
                                      <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                                        {swimmingClass.skills.length}{' '}
                                        {swimmingClass.skills.length === 1 ? 'skill' : 'skills'} ·{' '}
                                        {swimmingClass.durationMinutes} min
                                      </Text>
                                    </Group>
                                  </Card>
                                </UnstyledButton>
                              ))
                            )}
                          </Stack>
                        </Radio.Group>
                      )}
                    </Box>

                    <Box p="lg" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                      <Text fw={800}>Date range</Text>
                      <Text c="dimmed" size="sm" mb="md">
                        Lessons are created for every selected weekday between these dates.
                      </Text>
                      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                        <TextInput
                          type="date"
                          label="Start date"
                          value={startDate}
                          onChange={(event) => setStartDate(event.currentTarget.value)}
                          leftSection={<IconCalendar size={16} />}
                        />
                        <TextInput
                          type="date"
                          label="End date"
                          value={endDate}
                          onChange={(event) => setEndDate(event.currentTarget.value)}
                          leftSection={<IconCalendar size={16} />}
                        />
                        <Box>
                          <TextInput
                            type="time"
                            label="Start time"
                            value={startTime}
                            onChange={(event) => setStartTime(event.currentTarget.value)}
                            leftSection={<IconClock size={16} />}
                          />
                          {endsAt && (
                            <Text size="sm" c="dimmed" mt={6}>
                              Ends {formatClock(endsAt)}
                            </Text>
                          )}
                        </Box>
                      </SimpleGrid>

                      <Text fw={700} size="sm" mt="lg" mb="xs">
                        Repeats on
                      </Text>
                      <SimpleGrid cols={{ base: 2, sm: 7 }} spacing="xs">
                        {WEEKDAYS.map((weekday) => {
                          const selected = weekdays.includes(weekday.value)
                          return (
                            <Button
                              key={weekday.value}
                              type="button"
                              variant={selected ? 'filled' : 'default'}
                              onClick={() => toggleWeekday(weekday.value)}
                            >
                              {weekday.label}
                            </Button>
                          )
                        })}
                      </SimpleGrid>
                    </Box>

                    <Group
                      justify="space-between"
                      p="lg"
                      style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
                    >
                      <Box>
                        <Text fw={800}>
                          {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'} will be created
                        </Text>
                        {generationClass && (
                          <Text size="sm" c="dimmed">
                            {generationClass.name} · {weekdays.length}{' '}
                            {weekdays.length === 1 ? 'weekday' : 'weekdays'} ·{' '}
                            {generationClass.durationMinutes} min each
                          </Text>
                        )}
                        {classLessonsRemaining !== null && (
                          <Text size="sm" c={exceedsClassAllowance ? 'red' : 'dimmed'} mt={4}>
                            Class total: {classLessonCount} of {classMaxLessons} lessons ·{' '}
                            {classLessonsRemaining} remaining
                            {exceedsClassAllowance && ' — reduce the date range or weekdays'}
                          </Text>
                        )}
                      </Box>
                      <Button
                        type="submit"
                        loading={processing}
                        disabled={!generationClass || lessonCount === 0 || exceedsClassAllowance}
                      >
                        Generate lessons
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              )}
            </Form>
          </Guard>
        ) : null}

        {classes.length > 0 && !showGenerator && (
          <Card withBorder shadow="none" radius="md" padding="md">
            <Stack gap="md">
              <Group justify="space-between" align="flex-end">
                <Box>
                  <Text fw={800}>Filter lessons</Text>
                  <Text size="sm" c="dimmed">
                    Choose a class and narrow the lesson list before applying all filters.
                  </Text>
                </Box>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
                <NativeSelect
                  label="Level"
                  value={levelFilter}
                  onChange={(event) => {
                    const nextLevelId = event.currentTarget.value
                    setLevelFilter(nextLevelId)
                    setStageFilter(stageOptionsFor(classes, nextLevelId)[0]?.value ?? '')
                  }}
                  data={levelOptions}
                />
                <NativeSelect
                  label="Stage"
                  value={stageFilter}
                  onChange={(event) => setStageFilter(event.currentTarget.value)}
                  data={stageOptions}
                />
                <NativeSelect
                  label="Class"
                  value={classId}
                  onChange={(event) => {
                    setClassId(event.currentTarget.value)
                    setSelectedLessonIds([])
                  }}
                  data={visibleClasses.map((swimmingClass) => ({
                    value: String(swimmingClass.id),
                    label: swimmingClass.name,
                  }))}
                />
                {canFilterByInstructor && (
                  <NativeSelect
                    label="Instructor"
                    value={filterInstructorId}
                    onChange={(event) => setFilterInstructorId(event.currentTarget.value)}
                    data={instructorFilterOptions}
                  />
                )}
              </SimpleGrid>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                <TextInput
                  type="date"
                  label="From date"
                  value={filterStartDate}
                  onChange={(event) => setFilterStartDate(event.currentTarget.value)}
                />
                <TextInput
                  type="date"
                  label="To date"
                  value={filterEndDate}
                  onChange={(event) => setFilterEndDate(event.currentTarget.value)}
                />
                <NativeSelect
                  label="Activity status"
                  value={filterActivityStatus}
                  onChange={(event) =>
                    setFilterActivityStatus(event.currentTarget.value as ActivityFilter)
                  }
                  data={[
                    { value: 'all', label: 'All lessons' },
                    { value: 'with-activities', label: 'With activities' },
                    { value: 'without-activities', label: 'Without activities' },
                  ]}
                />
              </SimpleGrid>
              <Group justify="flex-end">
                <Button type="button" variant="subtle" color="gray" onClick={clearFilters}>
                  Clear filters
                </Button>
                <Button
                  type="button"
                  leftSection={<IconAdjustments size={16} />}
                  onClick={applyFilters}
                >
                  Apply filters
                </Button>
              </Group>
            </Stack>
          </Card>
        )}

        {selectedClass && filteredLessons.length > 0 && (
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Group gap="sm">
                {canShowLessonSelection && (
                  <Checkbox
                    disabled={!canBulkAssignInstructors}
                    checked={
                      filteredLessons.length > 0 &&
                      filteredLessons.every((lesson) => selectedLessonIds.includes(lesson.id))
                    }
                    indeterminate={
                      filteredLessons.some((lesson) => selectedLessonIds.includes(lesson.id)) &&
                      !filteredLessons.every((lesson) => selectedLessonIds.includes(lesson.id))
                    }
                    onChange={() =>
                      toggleMonthSelection(filteredLessons.map((lesson) => lesson.id))
                    }
                    aria-label="Select all visible lessons"
                  />
                )}
                <Title order={2} fz="xl">
                  {filteredLessons.length} {filteredLessons.length === 1 ? 'lesson' : 'lessons'} ·{' '}
                  {selectedClass.stage?.name ?? selectedClass.name}
                </Title>
              </Group>
              <Group gap="sm">
                <Button.Group>
                  <Button variant="default" leftSection={<IconList size={16} />}>
                    List
                  </Button>
                  <Button variant="subtle" color="gray" leftSection={<IconCalendar size={16} />}>
                    Calendar
                  </Button>
                </Button.Group>
              </Group>
            </Group>

            {groupedLessons(filteredLessons).map(([month, lessons]) => (
              <Card key={month} withBorder shadow="none" padding={0} radius="md">
                <Group justify="space-between" p="md">
                  <Group gap="sm">
                    {canShowLessonSelection && (
                      <Checkbox
                        disabled={!canBulkAssignInstructors}
                        checked={
                          lessons.length > 0 &&
                          lessons.every((lesson) => selectedLessonIds.includes(lesson.id))
                        }
                        indeterminate={
                          lessons.some((lesson) => selectedLessonIds.includes(lesson.id)) &&
                          !lessons.every((lesson) => selectedLessonIds.includes(lesson.id))
                        }
                        onChange={() => toggleMonthSelection(lessons.map((lesson) => lesson.id))}
                        aria-label={`Select all ${month} lessons`}
                      />
                    )}
                    <Text size="sm" tt="uppercase" c="dimmed" fw={800} lts="0.14em">
                      {month}
                    </Text>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
                  </Text>
                </Group>
                <Stack gap={0}>
                  {lessons.map((lesson) => {
                    const lessonNumber =
                      selectedClass.lessons.findIndex((item) => item.id === lesson.id) + 1
                    const lessonDuration = lesson.durationMinutes ?? selectedClass.durationMinutes
                    const lessonEnd = endTime(scheduledStart, lessonDuration)

                    return (
                      <Box key={lesson.id}>
                        <Group
                          justify="space-between"
                          wrap="nowrap"
                          px="md"
                          py="sm"
                          style={{
                            borderTop: '1px solid var(--mantine-color-gray-2)',
                            minHeight: 72,
                          }}
                        >
                          {canShowLessonSelection && (
                            <Checkbox
                              disabled={!canBulkAssignInstructors}
                              checked={selectedLessonIds.includes(lesson.id)}
                              onChange={() => toggleLessonSelection(lesson.id)}
                              aria-label={`Select lesson on ${lesson.date.formatted}`}
                            />
                          )}
                          <Text c="gray.4" fw={800} style={{ width: 52, flexShrink: 0 }}>
                            {String(lessonNumber).padStart(2, '0')}
                          </Text>
                          <Box style={{ minWidth: 0, flex: 1 }}>
                            <Text fw={800}>{lessonDateLabel(lesson.date.raw)}</Text>
                            <Text size="sm" c="dimmed">
                              {classLabel(selectedClass)}
                            </Text>
                          </Box>
                          <Text c="dimmed" style={{ width: 190, flexShrink: 0 }}>
                            {formatClock(scheduledStart)} - {formatClock(lessonEnd)}
                          </Text>
                          <Group gap="sm" wrap="nowrap" style={{ width: 220, flexShrink: 0 }}>
                            {lesson.leadInstructor ? (
                              <Box style={{ minWidth: 0 }}>
                                <Text fw={700} truncate>
                                  {lesson.leadInstructor.label}
                                </Text>
                                {lesson.supportingInstructors.length > 0 && (
                                  <Text size="xs" c="dimmed" truncate>
                                    +{' '}
                                    {lesson.supportingInstructors
                                      .map((instructor) => instructor.label)
                                      .join(', ')}
                                  </Text>
                                )}
                              </Box>
                            ) : (
                              <Text size="sm" c="dimmed">
                                Not assigned
                              </Text>
                            )}
                          </Group>
                          <Button
                            component={Link}
                            href={`${urlFor('swimming_classes.show', { id: selectedClass.id })}?${lesson.activities.length > 0 || lesson.objectives ? 'lessonId' : 'editLessonId'}=${lesson.id}`}
                            variant="subtle"
                          >
                            {lesson.activities.length > 0 || lesson.objectives
                              ? 'View lesson'
                              : 'Add activities'}
                          </Button>
                          <Group gap={2} wrap="nowrap">
                            <Guard for="lesson.instructors.manage">
                              <Tooltip label="Edit instructors">
                                <ActionIcon
                                  variant="subtle"
                                  color="blue"
                                  aria-label={`Edit instructors for ${lesson.date.formatted}`}
                                  onClick={() => setEditingLessonId(lesson.id)}
                                >
                                  <IconPencil size={16} />
                                </ActionIcon>
                              </Tooltip>
                            </Guard>
                            <Guard for="lesson.activities.manage">
                              {lesson.activities.length > 0 && (
                                <Tooltip label="Copy activities">
                                  <ActionIcon
                                    variant="subtle"
                                    color="blue"
                                    aria-label={`Copy activities from ${lesson.date.formatted}`}
                                    onClick={() => openCopyActivities(lesson.id)}
                                  >
                                    <IconCopy size={16} />
                                  </ActionIcon>
                                </Tooltip>
                              )}
                            </Guard>
                            <Guard for="class.manage">
                              <Form route="class_lessons.destroy" routeParams={{ id: lesson.id }}>
                                {({ processing }) => (
                                  <Tooltip label="Remove lesson">
                                    <ActionIcon
                                      type="submit"
                                      variant="subtle"
                                      color="gray"
                                      loading={processing}
                                      aria-label={`Remove lesson ${lesson.date.formatted}`}
                                    >
                                      <IconX size={16} />
                                    </ActionIcon>
                                  </Tooltip>
                                )}
                              </Form>
                            </Guard>
                          </Group>
                        </Group>
                        {copySourceLessonId === lesson.id && (
                          <Form
                            route="class_lessons.copy_activities"
                            routeParams={{ id: lesson.id }}
                            onSuccess={() => {
                              setCopySourceLessonId(null)
                              setCopyTargetLessonIds([])
                            }}
                          >
                            {({ processing }) => (
                              <Card
                                withBorder
                                shadow="none"
                                radius="md"
                                padding={0}
                                mx="md"
                                mb="md"
                                style={{ borderColor: 'var(--mantine-color-blue-2)' }}
                              >
                                {copyTargetLessonIds.map((targetLessonId, index) => (
                                  <input
                                    key={targetLessonId}
                                    type="hidden"
                                    name={`targetLessonIds[${index}]`}
                                    value={targetLessonId}
                                  />
                                ))}
                                <Group
                                  justify="space-between"
                                  align="flex-start"
                                  p="md"
                                  style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
                                >
                                  <Box>
                                    <Text size="sm" c="blue.7" fw={800} tt="uppercase">
                                      Copy {lesson.activities.length}{' '}
                                      {lesson.activities.length === 1 ? 'activity' : 'activities'}{' '}
                                      into other lessons
                                    </Text>
                                    <Text size="sm" c="dimmed" mt={4}>
                                      From {lessonDateLabel(lesson.date.raw)}. Only empty lessons in
                                      the same stage can be selected.
                                    </Text>
                                  </Box>
                                  {copyTargetLessons.length > 0 && (
                                    <Button
                                      type="button"
                                      variant="subtle"
                                      size="sm"
                                      onClick={toggleAllEmptyCopyTargets}
                                    >
                                      {copyTargetLessonIds.length === copyTargetLessons.length
                                        ? 'Clear selection'
                                        : `Select all empty (${copyTargetLessons.length})`}
                                    </Button>
                                  )}
                                </Group>
                                {copyTargetLessons.length > 0 ? (
                                  <Stack gap={0}>
                                    {copyTargetLessons.map((target) => {
                                      const targetLesson = target.lesson
                                      const checked = copyTargetLessonIds.includes(targetLesson.id)
                                      return (
                                        <Group
                                          key={targetLesson.id}
                                          justify="space-between"
                                          px="md"
                                          py="xs"
                                          style={{
                                            borderBottom: '1px solid var(--mantine-color-gray-2)',
                                            background: checked
                                              ? 'var(--mantine-color-blue-0)'
                                              : undefined,
                                          }}
                                        >
                                          <Checkbox
                                            label={lessonDateLabel(targetLesson.date.raw)}
                                            checked={checked}
                                            onChange={() => toggleCopyTarget(targetLesson.id)}
                                          />
                                          <Text size="sm" c="gray.5">
                                            {target.swimmingClass.id === selectedClass.id
                                              ? 'Empty'
                                              : `${target.swimmingClass.name} · Empty`}
                                          </Text>
                                        </Group>
                                      )
                                    })}
                                  </Stack>
                                ) : (
                                  <Text p="md" size="sm" c="dimmed">
                                    There are no empty lessons available in this stage.
                                  </Text>
                                )}
                                <Group
                                  justify="space-between"
                                  p="md"
                                  style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
                                >
                                  <Text size="sm" c="dimmed">
                                    Pick the lessons to copy into.
                                  </Text>
                                  <Group gap="xs">
                                    <Button
                                      type="button"
                                      variant="default"
                                      onClick={() => {
                                        setCopySourceLessonId(null)
                                        setCopyTargetLessonIds([])
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="submit"
                                      loading={processing}
                                      disabled={copyTargetLessonIds.length === 0}
                                    >
                                      Copy activities
                                    </Button>
                                  </Group>
                                </Group>
                              </Card>
                            )}
                          </Form>
                        )}
                      </Box>
                    )
                  })}
                </Stack>
              </Card>
            ))}
          </Stack>
        )}

        {selectedClass && filteredLessons.length === 0 && !showGenerator && (
          <Card withBorder shadow="none" radius="md">
            <Text fw={700}>
              {selectedClass.lessons.length === 0
                ? 'No lessons scheduled'
                : 'No lessons match these filters'}
            </Text>
            <Text c="dimmed" size="sm">
              {selectedClass.lessons.length === 0
                ? 'Generate lessons from the class page to build this schedule.'
                : 'Adjust the date range or activity status, then apply the filters again.'}
            </Text>
          </Card>
        )}
      </Stack>
      {canBulkAssignInstructors && selectedLessonIds.length > 0 && (
        <Paper
          withBorder
          shadow="xl"
          radius={0}
          p="md"
          pos="fixed"
          right={0}
          bottom={0}
          style={{
            zIndex: 100,
            left: 'var(--app-shell-navbar-width, 0px)',
            background: 'var(--mantine-color-dark-9)',
          }}
        >
          <Group justify="space-between" align="center" gap="md">
            <Group gap="md">
              <Text c="white" fw={800}>
                {selectedLessonIds.length} {selectedLessonIds.length === 1 ? 'lesson' : 'lessons'}
              </Text>
              <Text c="gray.4" size="sm" visibleFrom="sm">
                Replaces the instructor already on these lessons.
              </Text>
            </Group>
            <Group gap="sm">
              <Button
                type="button"
                variant="subtle"
                color="gray"
                onClick={() => {
                  setSelectedLessonIds([])
                  setBulkAssignmentOpened(false)
                }}
              >
                Clear
              </Button>
              <Button
                type="button"
                rightSection={<IconChevronDown size={16} />}
                onClick={() => setBulkAssignmentOpened(true)}
              >
                Assign instructors
              </Button>
            </Group>
          </Group>
        </Paper>
      )}
      <BulkAssignLessonInstructorsDrawer
        lessonIds={selectedLessonIds}
        instructorOptions={bulkInstructorOptions}
        opened={bulkAssignmentOpened}
        onClose={() => setBulkAssignmentOpened(false)}
        onSuccess={() => {
          setSelectedLessonIds([])
          setBulkAssignmentOpened(false)
        }}
      />
      <EditLessonInstructorsDrawer
        lesson={editingLesson}
        lessonNumber={
          editingLesson
            ? (selectedClass?.lessons.findIndex((lesson) => lesson.id === editingLesson.id) ?? -1) +
              1
            : 0
        }
        className={selectedClass ? classLabel(selectedClass) : ''}
        opened={Boolean(editingLesson)}
        instructorOptions={instructorOptions}
        pendingInstructorOptions={pendingInstructorOptions}
        onClose={() => setEditingLessonId(null)}
      />
    </Container>
  )
}
