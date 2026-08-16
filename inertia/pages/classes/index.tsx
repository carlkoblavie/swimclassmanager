import { useMemo, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import {
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  NativeSelect,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import ClassCard from '~/components/class_card'
import ClassesEmptyState from '~/components/classes_empty_state'
import { Guard } from '~/utils/permissions'

type PageProps = InertiaProps<{
  classes: Data.SwimmingClass[]
}>

type StatusFilter = 'all' | 'active' | 'cancelled'

const ALL = 'all'

function optionsFromClasses(
  classes: Data.SwimmingClass[],
  getValue: (item: Data.SwimmingClass) => string | null
) {
  return [
    ...new Set(classes.map(getValue).filter((value): value is string => Boolean(value))),
  ].sort((a, b) => a.localeCompare(b))
}

export default function ClassesIndex({ classes }: PageProps) {
  const [programFilter, setProgramFilter] = useState(ALL)
  const [levelFilter, setLevelFilter] = useState(ALL)
  const [stageFilter, setStageFilter] = useState(ALL)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')

  const activeCount = classes.filter((item) => !item.isCancelled).length
  const cancelledCount = classes.length - activeCount

  const programOptions = useMemo(
    () => optionsFromClasses(classes, (item) => item.level?.programName ?? null),
    [classes]
  )
  const levelOptions = useMemo(
    () =>
      optionsFromClasses(
        classes.filter(
          (item) => programFilter === ALL || item.level?.programName === programFilter
        ),
        (item) => item.level?.name ?? null
      ),
    [classes, programFilter]
  )
  const stageOptions = useMemo(
    () =>
      optionsFromClasses(
        classes.filter(
          (item) =>
            (programFilter === ALL || item.level?.programName === programFilter) &&
            (levelFilter === ALL || item.level?.name === levelFilter)
        ),
        (item) => item.stage?.name ?? null
      ),
    [classes, levelFilter, programFilter]
  )

  const visibleClasses = useMemo(
    () =>
      classes.filter((item) => {
        if (programFilter !== ALL && item.level?.programName !== programFilter) {
          return false
        }
        if (levelFilter !== ALL && item.level?.name !== levelFilter) {
          return false
        }
        if (stageFilter !== ALL && item.stage?.name !== stageFilter) {
          return false
        }
        if (statusFilter === 'active' && item.isCancelled) {
          return false
        }
        if (statusFilter === 'cancelled' && !item.isCancelled) {
          return false
        }
        return true
      }),
    [classes, levelFilter, programFilter, stageFilter, statusFilter]
  )
  const needLessonsCount = visibleClasses.filter((item) => item.lessons.length === 0).length

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Box>
            <Text size="xs" tt="uppercase" c="dimmed" fw={700} lts="0.16em">
              School
            </Text>
            <Title order={1}>Classes</Title>
            <Text c="dimmed" size="lg" maw={720}>
              Weekly classes across every program, level, and stage.
            </Text>
          </Box>
          <Guard for="class.manage">
            <Button
              component={Link}
              route="programs.index"
              size="lg"
              leftSection={<IconPlus size={18} />}
            >
              Create class
            </Button>
          </Guard>
        </Group>

        {classes.length === 0 ? (
          <ClassesEmptyState />
        ) : (
          <>
            <Group justify="space-between" align="center" gap="md" wrap="wrap">
              <Group gap={0} wrap="nowrap">
                <Tabs
                  value={statusFilter}
                  onChange={(value) => setStatusFilter((value as StatusFilter) ?? 'active')}
                  variant="pills"
                >
                  <Tabs.List bg="gray.1" p={4} style={{ borderRadius: 14 }}>
                    <Tabs.Tab value="active">Active ({activeCount})</Tabs.Tab>
                    <Tabs.Tab value="cancelled">Cancelled ({cancelledCount})</Tabs.Tab>
                    <Tabs.Tab value="all">All ({classes.length})</Tabs.Tab>
                  </Tabs.List>
                </Tabs>
                <Divider orientation="vertical" mx="md" />
                <Group gap="sm" wrap="wrap">
                  <NativeSelect
                    aria-label="Filter by program"
                    value={programFilter}
                    onChange={(event) => {
                      setProgramFilter(event.currentTarget.value)
                      setLevelFilter(ALL)
                      setStageFilter(ALL)
                    }}
                    data={[
                      { value: ALL, label: 'All programs' },
                      ...programOptions.map((value) => ({ value, label: value })),
                    ]}
                  />
                  <NativeSelect
                    aria-label="Filter by level"
                    value={levelFilter}
                    onChange={(event) => {
                      setLevelFilter(event.currentTarget.value)
                      setStageFilter(ALL)
                    }}
                    data={[
                      { value: ALL, label: 'All levels' },
                      ...levelOptions.map((value) => ({ value, label: value })),
                    ]}
                  />
                  <NativeSelect
                    aria-label="Filter by stage"
                    value={stageFilter}
                    onChange={(event) => setStageFilter(event.currentTarget.value)}
                    data={[
                      { value: ALL, label: 'All stages' },
                      ...stageOptions.map((value) => ({ value, label: value })),
                    ]}
                  />
                </Group>
              </Group>
              <Text c="dimmed" size="sm">
                {visibleClasses.length} {visibleClasses.length === 1 ? 'class' : 'classes'} ·{' '}
                {needLessonsCount} need lessons
              </Text>
            </Group>

            {visibleClasses.length === 0 ? (
              <Card withBorder shadow="none" radius="md">
                <Text fw={700}>No classes match these filters.</Text>
                <Text c="dimmed" size="sm">
                  Try widening the program, level, stage, or status filters.
                </Text>
              </Card>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {visibleClasses.map((swimmingClass) => (
                  <ClassCard key={swimmingClass.id} swimmingClass={swimmingClass} />
                ))}
              </SimpleGrid>
            )}
          </>
        )}
      </Stack>
    </Container>
  )
}
