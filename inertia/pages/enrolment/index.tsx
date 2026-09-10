import { Link } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import {
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  Drawer,
  Group,
  NativeSelect,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'
import type { InertiaProps } from '~/types'
import { urlFor } from '~/client'
import { Guard } from '~/utils/permissions'

type CatalogStage = { id: number; name: string; position: number }
type CatalogLevel = { id: number; name: string; stages: CatalogStage[] }
type CatalogProgram = { id: number; name: string; levels: CatalogLevel[] }

type AssignedStage = {
  levelStageId: number
  name: string
  levelId: number | null
  levelName: string | null
  position: number
  status: 'upcoming' | 'current' | 'completed'
}

type Learner = {
  id: number
  enrollmentId: number
  name: string
  initials: string
  age: number
  guardianName: string
  signupLevel: { id: number; name: string }
  stages: AssignedStage[]
}

type PageProps = InertiaProps<{
  schoolName: string
  swimYear: { id: number; name: string } | null
  catalog: CatalogProgram[]
  learners: Learner[]
}>

type Progress = 'unassigned' | 'assigned'

function learnerProgress(learner: Learner): Progress {
  return learner.stages.length === 0 ? 'unassigned' : 'assigned'
}

function StageBadges({ stages }: { stages: AssignedStage[] }) {
  if (stages.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No stages assigned
      </Text>
    )
  }
  const levelName = stages[0].levelName
  return (
    <Group gap={6} wrap="wrap" align="center">
      {levelName && (
        <Text size="sm" fw={600} c="gray.7">
          {levelName}:
        </Text>
      )}
      {stages.map((stage) => (
        <Badge key={stage.levelStageId} color="aqua" variant="light" radius="sm">
          {stage.name}
        </Badge>
      ))}
    </Group>
  )
}

function AssignStagesDrawer({
  learner,
  catalog,
  opened,
  onClose,
}: {
  learner: Learner | null
  catalog: CatalogProgram[]
  opened: boolean
  onClose: () => void
}) {
  const [programId, setProgramId] = useState('')
  const [levelId, setLevelId] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [step, setStep] = useState<'select' | 'confirm'>('select')
  const [saving, setSaving] = useState(false)

  // When a learner opens, default the drill-down to the level they're currently
  // in (from their assigned stages) or their signup level, and reset the step.
  useEffect(() => {
    if (!learner || !opened) {
      return
    }
    const targetLevelId = learner.stages[0]?.levelId ?? learner.signupLevel.id
    const program = catalog.find((p) => p.levels.some((l) => l.id === targetLevelId))
    setProgramId(program ? String(program.id) : String(catalog[0]?.id ?? ''))
    setLevelId(String(targetLevelId))
    setSelected(learner.stages.map((stage) => stage.levelStageId))
    setStep('select')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learner?.enrollmentId, opened])

  const program = catalog.find((p) => String(p.id) === programId)
  const level = program?.levels.find((l) => String(l.id) === levelId)

  const changeProgram = (value: string) => {
    setProgramId(value)
    const nextProgram = catalog.find((p) => String(p.id) === value)
    const nextLevel = nextProgram?.levels[0]
    setLevelId(nextLevel ? String(nextLevel.id) : '')
    setSelected([])
  }

  const changeLevel = (value: string) => {
    setLevelId(value)
    setSelected([])
  }

  const toggleAll = () => {
    const ids = (level?.stages ?? []).map((stage) => stage.id)
    setSelected((current) => (current.length === ids.length ? [] : ids))
  }

  const submit = () => {
    if (!learner) {
      return
    }
    setSaving(true)
    router.post(
      urlFor('enrolment.assign_stages'),
      { enrollmentId: learner.enrollmentId, levelStageIds: selected },
      { onSuccess: onClose, onFinish: () => setSaving(false) }
    )
  }

  const unassign = () => {
    if (!learner) {
      return
    }
    router.post(
      urlFor('enrolment.remove_stages'),
      { enrollmentId: learner.enrollmentId },
      { onSuccess: onClose }
    )
  }

  return (
    <Drawer opened={opened} onClose={onClose} position="right" size={480} title={null} padding={0}>
      {learner && (
        <Stack gap={0} mih="100%">
          <Box p="lg">
            <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.14em">
              Assign stages
            </Text>
            <Title order={2} mt={4}>
              {learner.name}
            </Title>
            <Text c="dimmed" mt={2}>
              Signed up for {learner.signupLevel.name} · age {learner.age}
            </Text>
          </Box>
          <Divider />

          {step === 'select' ? (
                <Stack gap="md" p="lg" style={{ flex: 1 }}>
                  <Text size="sm" c="dimmed">
                    Drill down to the level, then pick the stages to assign this learner to.
                  </Text>

                  <NativeSelect
                    label="Program"
                    value={programId}
                    onChange={(event) => changeProgram(event.currentTarget.value)}
                    data={catalog.map((p) => ({ value: String(p.id), label: p.name }))}
                  />
                  <NativeSelect
                    label="Level"
                    value={levelId}
                    onChange={(event) => changeLevel(event.currentTarget.value)}
                    data={(program?.levels ?? []).map((l) => ({
                      value: String(l.id),
                      label: l.name,
                    }))}
                  />

                  <Box>
                    <Group justify="space-between" align="baseline" mb="xs">
                      <Text size="sm" fw={600}>
                        Stages
                      </Text>
                      {(level?.stages.length ?? 0) > 0 && (
                        <Button variant="subtle" size="compact-xs" onClick={toggleAll}>
                          {selected.length === level?.stages.length ? 'Clear all' : 'Select all'}
                        </Button>
                      )}
                    </Group>
                    <Stack gap="xs">
                      {!level || level.stages.length === 0 ? (
                        <Text size="sm" c="dimmed">
                          This level has no stages yet.
                        </Text>
                      ) : (
                        level.stages.map((stage, index) => {
                          const orderedIds = level.stages.map((s) => s.id)
                          const checked = selected.includes(stage.id)
                          return (
                            <Box
                              key={stage.id}
                              p="sm"
                              style={{
                                border: '1px solid var(--mantine-color-gray-3)',
                                borderRadius: 10,
                              }}
                            >
                              <Checkbox
                                checked={checked}
                                onChange={() =>
                                  // Stages are progressive: selecting one selects
                                  // every stage up to it; clearing one clears it
                                  // and everything after. No gaps.
                                  setSelected(
                                    checked
                                      ? orderedIds.slice(0, index)
                                      : orderedIds.slice(0, index + 1)
                                  )
                                }
                                label={<Text>{stage.name}</Text>}
                              />
                            </Box>
                          )
                        })
                      )}
                    </Stack>
                  </Box>
                </Stack>
              ) : (
                <Stack gap="sm" p="lg" style={{ flex: 1 }}>
                  <Text size="sm" c="dimmed">
                    Confirm this assignment for {learner.name}.
                  </Text>
                  <Box
                    p="md"
                    style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 12 }}
                  >
                    <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.1em">
                      {program?.name}
                    </Text>
                    <Text fw={700} mt={2}>
                      {level?.name}
                    </Text>
                    <Group gap={6} mt="sm" wrap="wrap">
                      {(level?.stages ?? [])
                        .filter((stage) => selected.includes(stage.id))
                        .map((stage) => (
                          <Badge key={stage.id} color="aqua" variant="light" radius="sm">
                            {stage.name}
                          </Badge>
                        ))}
                    </Group>
                  </Box>
                  <Text size="xs" c="dimmed">
                    This replaces the learner’s current stage assignment.
                  </Text>
                </Stack>
              )}

              <Box p="lg" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                {step === 'select' ? (
                  <Group justify="space-between">
                    {learner.stages.length > 0 ? (
                      <Button type="button" variant="subtle" color="red" onClick={unassign}>
                        Unassign
                      </Button>
                    ) : (
                      <span />
                    )}
                    <Group gap="sm">
                      <Button type="button" variant="default" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setStep('confirm')}
                        disabled={selected.length === 0}
                      >
                        Review
                      </Button>
                    </Group>
                  </Group>
                ) : (
                  <Group justify="space-between">
                    <Button type="button" variant="default" onClick={() => setStep('select')}>
                      Back
                    </Button>
                    <Button type="button" onClick={submit} loading={saving}>
                      Confirm &amp; save
                    </Button>
                  </Group>
                )}
              </Box>
        </Stack>
      )}
    </Drawer>
  )
}

export default function EnrolmentIndex({ swimYear, catalog, learners }: PageProps) {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [tab, setTab] = useState<'all' | Progress>('all')
  const [assignLearner, setAssignLearner] = useState<Learner | null>(null)

  const levelOptions = useMemo(
    () => [...new Set(learners.map((learner) => learner.signupLevel.name))].sort(),
    [learners]
  )

  const counts = useMemo(() => {
    const c = { all: learners.length, unassigned: 0, assigned: 0 }
    for (const learner of learners) {
      c[learnerProgress(learner)] += 1
    }
    return c
  }, [learners])

  const visible = useMemo(
    () =>
      learners.filter((learner) => {
        if (levelFilter !== 'all' && learner.signupLevel.name !== levelFilter) {
          return false
        }
        if (tab !== 'all' && learnerProgress(learner) !== tab) {
          return false
        }
        const q = search.trim().toLowerCase()
        if (q && !`${learner.name} ${learner.guardianName}`.toLowerCase().includes(q)) {
          return false
        }
        return true
      }),
    [learners, levelFilter, tab, search]
  )

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Box>
          <Text size="xs" tt="uppercase" c="dimmed" fw={700} lts="0.16em">
            Enrolment
          </Text>
          <Title order={1}>Learners</Title>
          <Text c="dimmed" size="lg">
            Assign learners to stages and progress them through a level.
            {swimYear ? ` · ${swimYear.name}` : ''}
          </Text>
        </Box>

        {learners.length === 0 ? (
          <Box
            p="lg"
            style={{ border: '1px solid var(--mantine-color-gray-2)', borderRadius: 12 }}
          >
            <Text fw={700}>No signups yet.</Text>
            <Text c="dimmed" size="sm">
              Learners appear here once they’ve registered.
            </Text>
          </Box>
        ) : (
          <>
            <Group justify="space-between" align="center" wrap="wrap" gap="md">
              <Tabs value={tab} onChange={(value) => setTab((value as typeof tab) ?? 'all')} variant="pills">
                <Tabs.List bg="gray.1" p={4} style={{ borderRadius: 14 }}>
                  <Tabs.Tab value="all">All ({counts.all})</Tabs.Tab>
                  <Tabs.Tab value="unassigned">Not assigned ({counts.unassigned})</Tabs.Tab>
                  <Tabs.Tab value="assigned">Assigned ({counts.assigned})</Tabs.Tab>
                </Tabs.List>
              </Tabs>
              <Group gap="sm" wrap="wrap">
                <TextInput
                  leftSection={<IconSearch size={16} />}
                  placeholder="Search learner or guardian"
                  value={search}
                  onChange={(event) => setSearch(event.currentTarget.value)}
                  w={260}
                />
                <NativeSelect
                  aria-label="Filter by level"
                  value={levelFilter}
                  onChange={(event) => setLevelFilter(event.currentTarget.value)}
                  data={[
                    { value: 'all', label: 'All levels' },
                    ...levelOptions.map((name) => ({ value: name, label: name })),
                  ]}
                />
              </Group>
            </Group>

            <Box
              style={{
                border: '1px solid var(--mantine-color-gray-2)',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <Stack gap={0}>
                {visible.length === 0 ? (
                  <Text c="dimmed" size="sm" p="lg">
                    No learners match these filters.
                  </Text>
                ) : (
                  visible.map((learner) => (
                    <Group
                      key={learner.enrollmentId}
                      justify="space-between"
                      wrap="nowrap"
                      align="center"
                      p="md"
                      px="lg"
                      gap="md"
                      style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
                    >
                      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                        <Avatar radius="xl" color="aqua">
                          {learner.initials}
                        </Avatar>
                        <Box style={{ minWidth: 0 }}>
                          <Anchor
                            component={Link}
                            route="learners.show"
                            routeParams={{ id: learner.id }}
                            fw={700}
                            c="dark"
                            underline="hover"
                            truncate
                            style={{ display: 'block' }}
                          >
                            {learner.name}
                          </Anchor>
                          <Text size="sm" c="dimmed" truncate>
                            {learner.signupLevel.name} · age {learner.age} · {learner.guardianName}
                          </Text>
                        </Box>
                      </Group>

                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <StageBadges stages={learner.stages} />
                      </Box>

                      <Guard for="enrolment.place">
                        <Button
                          variant="default"
                          onClick={() => setAssignLearner(learner)}
                          style={{ flexShrink: 0 }}
                        >
                          {learner.stages.length > 0 ? 'Edit stages' : 'Assign stages'}
                        </Button>
                      </Guard>
                    </Group>
                  ))
                )}
              </Stack>
            </Box>
          </>
        )}
      </Stack>

      <AssignStagesDrawer
        learner={assignLearner}
        catalog={catalog}
        opened={Boolean(assignLearner)}
        onClose={() => setAssignLearner(null)}
      />
    </Container>
  )
}
