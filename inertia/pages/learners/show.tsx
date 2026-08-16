import { Link } from '@adonisjs/inertia/react'
import {
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  Group,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconCalendar, IconMail, IconPhone } from '@tabler/icons-react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'

type PageProps = InertiaProps<{
  profile: Data.LearnerProfile
}>

function formatMoney(amount: number, currency: string) {
  return `${currency} ${(amount / 100).toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function paymentLabel(status: 'paid' | 'part_paid' | 'pending') {
  if (status === 'paid') return 'Paid'
  if (status === 'part_paid') return 'Part paid'
  return 'Pending'
}

function lessonStatusColor(status: 'upcoming' | 'taught') {
  return status === 'taught' ? 'teal' : 'gray'
}

function SummaryCell({
  label,
  value,
  detail,
  color,
}: {
  label: string
  value: string
  detail?: string
  color?: string
}) {
  return (
    <Stack gap={2} p="lg" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
      <Text size="xs" fw={800} c="dimmed" tt="uppercase" style={{ letterSpacing: 1.2 }}>
        {label}
      </Text>
      <Text size="xl" fw={800} c={color}>
        {value}
      </Text>
      {detail && (
        <Text size="sm" c="dimmed">
          {detail}
        </Text>
      )}
    </Stack>
  )
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <Group justify="space-between" px="lg" py="md">
      <Text fw={800} c="dimmed" tt="uppercase" size="sm" style={{ letterSpacing: 1.4 }}>
        {title}
      </Text>
      {action}
    </Group>
  )
}

export default function LearnerShow({ profile }: PageProps) {
  const { learner, guardian, currentEnrollment, pathway, skills } = profile
  const lessons = currentEnrollment?.lessons ?? []
  const classInfo = currentEnrollment?.class

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group gap="sm">
          <Anchor component={Link} route="enrolment.index" size="sm">
            Learners
          </Anchor>
          <Text c="dimmed">/</Text>
          <Text size="sm" fw={600}>
            {learner.name}
          </Text>
        </Group>

        <Card withBorder padding={0} radius="lg">
          <Group justify="space-between" align="flex-start" p="xl" wrap="wrap" gap="lg">
            <Group wrap="nowrap" align="center">
              <Avatar size={82} radius="xl" color="blue" fz="xl">
                {learner.initials}
              </Avatar>
              <Stack gap={3}>
                <Title order={1}>{learner.name}</Title>
                <Text c="dimmed">
                  Age {learner.age} · {learner.gender} · Learner #{learner.id} · Joined{' '}
                  {learner.joined}
                </Text>
              </Stack>
            </Group>
            <Group>
              <Button variant="default" disabled>
                Message guardian
              </Button>
              <Button disabled>Record assessment</Button>
            </Group>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
            <SummaryCell
              label="Level"
              value={currentEnrollment?.levelName ?? 'Not placed'}
              detail={currentEnrollment?.stageName ?? 'No current class'}
            />
            <SummaryCell
              label="Lessons"
              value={lessons.length ? `${lessons.length}` : '—'}
              detail={lessons.length ? 'linked to current enrolment' : 'No lessons linked'}
            />
            <SummaryCell
              label="Fees"
              value={currentEnrollment ? paymentLabel(currentEnrollment.paymentStatus) : '—'}
              detail={
                currentEnrollment
                  ? formatMoney(currentEnrollment.price, currentEnrollment.currency)
                  : 'No enrolment'
              }
              color={currentEnrollment?.paymentStatus === 'paid' ? 'teal.8' : undefined}
            />
            <SummaryCell
              label="Guardian"
              value={guardian?.name ?? 'Not provided'}
              detail={guardian?.relation ?? 'No contact'}
            />
          </SimpleGrid>
        </Card>

        <Grid gap="lg">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="lg">
              <Card withBorder padding={0} radius="lg">
                <SectionHeader
                  title="Current enrolment"
                  action={
                    <Button variant="subtle" size="compact-sm" disabled>
                      Change class
                    </Button>
                  }
                />
                <Divider />
                <Stack p="lg" gap="md">
                  {currentEnrollment ? (
                    <>
                      <div>
                        <Title order={3}>{classInfo?.name ?? 'Not placed in a class'}</Title>
                        <Text c="dimmed" mt={2}>
                          {currentEnrollment.levelName} · {currentEnrollment.stageName}
                        </Text>
                      </div>
                      <SimpleGrid cols={{ base: 1, sm: 3 }}>
                        <InfoItem
                          label="Schedule"
                          value={
                            classInfo
                              ? [classInfo.weekday, classInfo.startTime]
                                  .filter(Boolean)
                                  .join(' · ') || 'Not set'
                              : 'Not set'
                          }
                        />
                        <InfoItem
                          label="Duration"
                          value={classInfo ? `${classInfo.durationMinutes} min` : '—'}
                        />
                        <InfoItem
                          label="Instructor"
                          value={classInfo?.instructor ?? 'Not assigned'}
                        />
                      </SimpleGrid>
                      <Text size="sm" c="dimmed">
                        Enrolled {currentEnrollment.startDate ?? 'date not recorded'}
                        {currentEnrollment.termName ? ` · ${currentEnrollment.termName}` : ''}
                      </Text>
                    </>
                  ) : (
                    <Text c="dimmed">This learner has not been placed in a class yet.</Text>
                  )}
                </Stack>
              </Card>

              <Card withBorder padding={0} radius="lg">
                <SectionHeader
                  title="Lessons"
                  action={
                    classInfo?.weekday && classInfo.startTime ? (
                      <Text size="sm" c="dimmed">
                        Every {classInfo.weekday} · {classInfo.startTime}
                      </Text>
                    ) : undefined
                  }
                />
                <Divider />
                {lessons.length ? (
                  lessons.map((lesson, index) => (
                    <Group
                      key={lesson.id}
                      px="lg"
                      py="sm"
                      justify="space-between"
                      style={{
                        borderBottom:
                          index < lessons.length - 1
                            ? '1px solid var(--mantine-color-gray-2)'
                            : undefined,
                      }}
                    >
                      <Group gap="md">
                        <Text w={28} c="dimmed" fw={700}>
                          {String(index + 1).padStart(2, '0')}
                        </Text>
                        <Group gap="xs">
                          <IconCalendar size={16} color="var(--mantine-color-gray-5)" />
                          <Text fw={600}>{lesson.date}</Text>
                        </Group>
                      </Group>
                      <Group gap="xl">
                        <Text c="dimmed">{lesson.durationMinutes} min</Text>
                        <Badge variant="light" color={lessonStatusColor(lesson.status)}>
                          {lesson.status === 'taught' ? 'Taught' : 'Upcoming'}
                        </Badge>
                      </Group>
                    </Group>
                  ))
                ) : (
                  <Text p="lg" c="dimmed">
                    No lessons are linked to this enrolment yet.
                  </Text>
                )}
              </Card>

              <Card withBorder padding={0} radius="lg">
                <SectionHeader
                  title="Skills in this level"
                  action={
                    <Text size="sm" c="dimmed">
                      Visual placeholder
                    </Text>
                  }
                />
                <Divider />
                {skills.length ? (
                  skills.map((skill, index) => (
                    <Stack
                      key={skill.id}
                      gap={5}
                      px="lg"
                      py="md"
                      style={{
                        borderBottom:
                          index < skills.length - 1
                            ? '1px solid var(--mantine-color-gray-2)'
                            : undefined,
                      }}
                    >
                      <Group justify="space-between">
                        <Text fw={700}>{skill.name}</Text>
                        <Text size="sm" c="dimmed">
                          Not assessed
                        </Text>
                      </Group>
                      <Progress value={0} color="gray" size="sm" />
                      <Text size="sm" c="dimmed">
                        {skill.passCriteria}
                      </Text>
                    </Stack>
                  ))
                ) : (
                  <Text p="lg" c="dimmed">
                    No skills have been configured for this level yet.
                  </Text>
                )}
              </Card>

              <Card withBorder padding={0} radius="lg">
                <SectionHeader
                  title="Attendance"
                  action={
                    <Text size="sm" c="dimmed">
                      Visual placeholder
                    </Text>
                  }
                />
                <Divider />
                <Stack p="lg" gap="md">
                  <Group gap="xs" wrap="wrap">
                    {Array.from({ length: 8 }, (_, index) => (
                      <Box
                        key={index}
                        w={42}
                        h={42}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 10,
                          border: '1px solid var(--mantine-color-gray-3)',
                          color: 'var(--mantine-color-gray-5)',
                          background: 'var(--mantine-color-gray-0)',
                        }}
                      >
                        —
                      </Box>
                    ))}
                  </Group>
                  <Text size="sm" c="dimmed">
                    Attendance records will appear here when lessons are marked present, absent, or
                    late.
                  </Text>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="lg">
              <Card withBorder padding={0} radius="lg">
                <SectionHeader title="Pathway" />
                <Divider />
                <Stack p="lg" gap="md">
                  {pathway.length ? (
                    pathway.map((step, index) => (
                      <Group key={step.id} align="flex-start" wrap="nowrap" gap="md">
                        <Box
                          w={18}
                          h={18}
                          mt={3}
                          style={{
                            borderRadius: '50%',
                            background:
                              step.status === 'Current'
                                ? 'var(--mantine-color-blue-6)'
                                : 'var(--mantine-color-gray-3)',
                            flexShrink: 0,
                          }}
                        />
                        <Box>
                          <Text fw={700}>
                            {step.levelName} · {step.stageName}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {step.status}
                          </Text>
                        </Box>
                        {index < pathway.length - 1 && <Divider orientation="vertical" />}
                      </Group>
                    ))
                  ) : (
                    <Text c="dimmed">No pathway information yet.</Text>
                  )}
                </Stack>
              </Card>

              <Card withBorder padding={0} radius="lg">
                <SectionHeader title="Guardian" />
                <Divider />
                <Stack p="lg" gap="sm">
                  {guardian ? (
                    <>
                      <Group>
                        <Avatar radius="xl" color="gray">
                          {guardian.name.slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Text fw={700}>{guardian.name}</Text>
                          <Text size="sm" c="dimmed">
                            {guardian.relation}
                          </Text>
                        </Box>
                      </Group>
                      <Group gap="sm" wrap="nowrap">
                        <IconMail size={16} color="var(--mantine-color-gray-6)" />
                        <Text size="sm">{guardian.email}</Text>
                      </Group>
                      <Group gap="sm" wrap="nowrap">
                        <IconPhone size={16} color="var(--mantine-color-gray-6)" />
                        <Text size="sm">{guardian.phone}</Text>
                      </Group>
                      {guardian.whatsapp && (
                        <Text size="sm" c="dimmed">
                          WhatsApp: {guardian.whatsapp}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text c="dimmed">No guardian contact is recorded.</Text>
                  )}
                </Stack>
              </Card>

              <Card withBorder padding={0} radius="lg">
                <SectionHeader title="Record" />
                <Divider />
                <Stack p="lg" gap="sm">
                  <InfoItem
                    label="Medical"
                    value={learner.medicalInfo || 'No medical information recorded'}
                  />
                  <InfoItem
                    label="Swimming experience"
                    value={learner.swimmingExperience || 'Not recorded'}
                  />
                  <InfoItem
                    label="Location"
                    value={learner.residentialLocation || 'Not recorded'}
                  />
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2}>
      <Text size="xs" fw={800} c="dimmed" tt="uppercase" style={{ letterSpacing: 1.1 }}>
        {label}
      </Text>
      <Text>{value}</Text>
    </Stack>
  )
}
