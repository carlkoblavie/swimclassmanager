import { Link } from '@adonisjs/inertia/react'
import {
  Anchor,
  Box,
  Card,
  Container,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconCalendarEvent,
  IconChevronRight,
  IconClock,
  IconFileInvoice,
  IconListCheck,
  IconSchool,
  IconUsers,
} from '@tabler/icons-react'
import type { InertiaProps } from '~/types'

type DashboardLesson = {
  id: number
  classId: number
  label: string
  date: string
  dateLabel: string
  time: string
  durationMinutes: number
  instructor: string | null
  hasActivities: boolean
  href: string
}

type DashboardMetric = { label: string; value: number; detail: string }

type DashboardData = {
  mode: 'management' | 'instructor'
  term: { yearName: string; termName: string } | null
  greeting: string
  metrics: {
    first: DashboardMetric
    second: DashboardMetric
    third: DashboardMetric
    fourth: DashboardMetric
  }
  today: { dateLabel: string; lessons: DashboardLesson[] }
  upcoming: DashboardLesson[]
  needsYou: Array<{ label: string; detail: string; tone: string }>
  revenue: {
    currency: string
    collected: number
    outstanding: number
    overdue: number
    months: Array<{ label: string; collected: number; invoiced: number }>
  } | null
}

type PageProps = InertiaProps<{ dashboard: DashboardData }>

const toneColors: Record<string, string> = { red: 'red', amber: 'yellow', blue: 'blue' }

function money(amount: number, currency: string) {
  return `${currency} ${(amount / 100).toLocaleString('en-GH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

function MetricCard({ metric, icon }: { metric: DashboardMetric; icon: React.ReactNode }) {
  return (
    <Card withBorder radius="lg" padding="lg" shadow="none" h="100%">
      <Group justify="space-between" align="flex-start">
        <Text size="xs" fw={800} c="dimmed" tt="uppercase" style={{ letterSpacing: 1.4 }}>
          {metric.label}
        </Text>
        <ThemeIcon variant="light" color="blue" radius="md" size="lg">
          {icon}
        </ThemeIcon>
      </Group>
      <Text fz={38} fw={800} lh={1.1} mt="md">
        {metric.value.toLocaleString()}
      </Text>
      <Text c="dimmed" mt={6}>
        {metric.detail}
      </Text>
    </Card>
  )
}

function LessonRow({ lesson }: { lesson: DashboardLesson }) {
  return (
    <Anchor
      component={Link}
      href={lesson.href}
      display="block"
      style={{ color: 'inherit', textDecoration: 'none' }}
    >
      <Group wrap="nowrap" gap="md" py="sm" px="lg">
        <Box w={74} style={{ flexShrink: 0 }}>
          <Text fw={800}>{lesson.time}</Text>
          <Text size="xs" c="dimmed">
            {lesson.durationMinutes} min
          </Text>
        </Box>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text fw={700} truncate>
            {lesson.label}
          </Text>
          <Text size="sm" c="dimmed" truncate>
            {lesson.instructor ?? 'No instructor assigned'}
          </Text>
        </Box>
        <Text size="sm" c={lesson.hasActivities ? 'teal' : 'yellow.8'} fw={700} visibleFrom="sm">
          {lesson.hasActivities ? 'Ready' : 'To prepare'}
        </Text>
        <IconChevronRight size={18} color="var(--mantine-color-gray-5)" />
      </Group>
    </Anchor>
  )
}

function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <Group justify="space-between" px="lg" py="md">
      <Text fw={800} c="dimmed" tt="uppercase" size="sm" style={{ letterSpacing: 1.4 }}>
        {title}
      </Text>
      {action}
    </Group>
  )
}

function ScheduleCard({ dashboard }: { dashboard: DashboardData }) {
  const lessons = dashboard.today.lessons.length > 0 ? dashboard.today.lessons : dashboard.upcoming
  const showingToday = dashboard.today.lessons.length > 0

  return (
    <Card withBorder radius="lg" padding={0} shadow="none">
      <SectionHeading
        title={showingToday ? 'Today' : 'Upcoming lessons'}
        action={
          <Text size="sm" c="dimmed">
            {showingToday ? dashboard.today.dateLabel : 'Next assigned lessons'}
          </Text>
        }
      />
      <Divider />
      {lessons.length > 0 ? (
        <Stack gap={0}>
          {lessons.slice(0, 5).map((lesson) => (
            <LessonRow key={lesson.id} lesson={lesson} />
          ))}
        </Stack>
      ) : (
        <Text c="dimmed" px="lg" py="xl">
          No lessons assigned to you yet.
        </Text>
      )}
      <Divider />
      <Group justify="space-between" px="lg" py="sm">
        <Text size="sm" c="dimmed">
          {dashboard.today.lessons.length} lessons today
        </Text>
        <Anchor component={Link} route="lessons.index" size="sm" fw={700}>
          All lessons
        </Anchor>
      </Group>
    </Card>
  )
}

function NeedsYouCard({ items }: { items: DashboardData['needsYou'] }) {
  return (
    <Card withBorder radius="lg" padding={0} shadow="none">
      <SectionHeading title="Needs you" />
      <Divider />
      {items.length > 0 ? (
        <Stack gap={0}>
          {items.map((item) => (
            <Group key={item.label} wrap="nowrap" px="lg" py="md" gap="md">
              <ThemeIcon color={toneColors[item.tone] ?? 'blue'} variant="light" radius="md">
                <IconAlertTriangle size={18} />
              </ThemeIcon>
              <Box style={{ flex: 1 }}>
                <Text fw={700}>{item.label}</Text>
                <Text size="sm" c="dimmed">
                  {item.detail}
                </Text>
              </Box>
              <IconChevronRight size={18} color="var(--mantine-color-gray-5)" />
            </Group>
          ))}
        </Stack>
      ) : (
        <Group px="lg" py="xl" gap="sm">
          <ThemeIcon color="teal" variant="light" radius="xl">
            <IconListCheck size={18} />
          </ThemeIcon>
          <Text c="dimmed">Everything is up to date.</Text>
        </Group>
      )}
    </Card>
  )
}

function RevenueCard({ revenue }: { revenue: NonNullable<DashboardData['revenue']> }) {
  const max = Math.max(...revenue.months.map((month) => month.invoiced), 1)

  return (
    <Card withBorder radius="lg" padding={0} shadow="none">
      <SectionHeading
        title="Revenue"
        action={
          <Text size="sm" c="dimmed">
            {revenue.currency} · this term
          </Text>
        }
      />
      <Divider />
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={0}>
        <Stack gap="lg" p="lg">
          <Box>
            <Text size="xs" fw={800} c="dimmed" tt="uppercase" style={{ letterSpacing: 1.2 }}>
              Collected
            </Text>
            <Text fz={28} fw={800} c="teal.8">
              {money(revenue.collected, revenue.currency)}
            </Text>
          </Box>
          <Box>
            <Text size="xs" fw={800} c="dimmed" tt="uppercase" style={{ letterSpacing: 1.2 }}>
              Outstanding
            </Text>
            <Text fz={28} fw={800}>
              {money(revenue.outstanding, revenue.currency)}
            </Text>
          </Box>
          <Box>
            <Text size="xs" fw={800} c="dimmed" tt="uppercase" style={{ letterSpacing: 1.2 }}>
              Overdue
            </Text>
            <Text fz={28} fw={800} c="red.8">
              {money(revenue.overdue, revenue.currency)}
            </Text>
          </Box>
        </Stack>
        <Box p="lg" style={{ borderLeft: '1px solid var(--mantine-color-gray-2)' }}>
          <Group h={170} align="flex-end" justify="space-between" gap="xs">
            {revenue.months.map((month) => (
              <Stack key={month.label} gap={6} align="center" style={{ flex: 1 }}>
                <Box
                  w="100%"
                  maw={48}
                  h={Math.max((month.invoiced / max) * 130, month.invoiced ? 12 : 4)}
                  style={{
                    background: month.collected >= month.invoiced ? '#3f9d8f' : '#4d82cf',
                    borderRadius: '6px 6px 2px 2px',
                  }}
                />
                <Text size="xs" c="dimmed">
                  {month.label}
                </Text>
              </Stack>
            ))}
          </Group>
          <Text size="sm" c="dimmed" mt="lg">
            Collected against invoices issued over the last six months.
          </Text>
        </Box>
      </SimpleGrid>
    </Card>
  )
}

export default function Home({ dashboard }: PageProps) {
  const isInstructor = dashboard.mode === 'instructor'

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-start">
          <Box>
            <Text size="xs" tt="uppercase" c="dimmed" fw={800} style={{ letterSpacing: 2 }}>
              Dashboard
            </Text>
            <Title order={1} mt={4}>
              {dashboard.greeting}
            </Title>
          </Box>
          {dashboard.term && (
            <Text c="dimmed" size="sm" mt="xs">
              {dashboard.term.yearName} · {dashboard.term.termName}
            </Text>
          )}
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          <MetricCard metric={dashboard.metrics.first} icon={<IconFileInvoice size={20} />} />
          <MetricCard metric={dashboard.metrics.second} icon={<IconUsers size={20} />} />
          <MetricCard metric={dashboard.metrics.third} icon={<IconCalendarEvent size={20} />} />
          <MetricCard metric={dashboard.metrics.fourth} icon={<IconSchool size={20} />} />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <ScheduleCard dashboard={dashboard} />
          <NeedsYouCard items={dashboard.needsYou} />
        </SimpleGrid>

        {!isInstructor && dashboard.revenue && <RevenueCard revenue={dashboard.revenue} />}

        {isInstructor && dashboard.upcoming.length > 0 && dashboard.today.lessons.length > 0 && (
          <Card withBorder radius="lg" padding={0} shadow="none">
            <SectionHeading
              title="Next up"
              action={<IconClock size={18} color="var(--mantine-color-gray-5)" />}
            />
            <Divider />
            <Stack gap={0}>
              {dashboard.upcoming.slice(0, 3).map((lesson) => (
                <Group key={lesson.id} px="lg" py="sm" justify="space-between">
                  <Box>
                    <Text fw={700}>{lesson.label}</Text>
                    <Text size="sm" c="dimmed">
                      {lesson.dateLabel} · {lesson.time}
                    </Text>
                  </Box>
                  <Anchor component={Link} href={lesson.href} size="sm" fw={700}>
                    Open
                  </Anchor>
                </Group>
              ))}
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
