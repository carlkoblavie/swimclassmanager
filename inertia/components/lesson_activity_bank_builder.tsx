import { Fragment, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Drawer,
  Group,
  Progress,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { IconGripVertical, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'
import type { Data } from '@generated/data'

type Activity = Data.SchoolActivityCategory['activities'][number]

type ActivityWithCategory = Activity & {
  categoryId: number
  categoryName: string
}

type SelectedActivity = {
  key: string
  activityId: number
  durationMinutes: string
  ledBy: string
}

type InitialActivity = {
  schoolActivityId: number
  durationMinutes: number | null
  ledBy: number | null
}

const ACTIVITY_LEADERS = [
  { value: '1', label: 'Instructor' },
  { value: '2', label: 'Learner' },
  { value: '3', label: 'Mixed' },
]

function activityLeaderLabel(value: number | null) {
  if (value === 2) {
    return 'Learner-led'
  }

  if (value === 3) {
    return 'Mixed'
  }

  return 'Instructor-led'
}

export default function LessonActivityBankBuilder({
  activityBank,
  durationMinutes,
  initialActivities,
  initialSelection = [],
  initialDurations = {},
  initialLedBys = {},
}: {
  activityBank: Data.SchoolActivityCategory[]
  durationMinutes: number
  initialActivities?: InitialActivity[]
  initialSelection?: number[]
  initialDurations?: Record<number, number | null>
  initialLedBys?: Record<number, number | null>
}) {
  const allActivities: ActivityWithCategory[] = activityBank.flatMap((category) =>
    category.activities.map((activity) => ({
      ...activity,
      categoryId: category.id,
      categoryName: category.name,
    }))
  )
  const activityById = new Map(allActivities.map((activity) => [activity.id, activity]))
  const initialRows =
    initialActivities ??
    initialSelection.map((activityId) => ({
      schoolActivityId: activityId,
      durationMinutes: initialDurations[activityId] ?? null,
      ledBy: initialLedBys[activityId] ?? null,
    }))
  const [selectedActivities, setSelectedActivities] = useState<SelectedActivity[]>(() =>
    initialRows.map((row, index) => {
      const activity = activityById.get(row.schoolActivityId)
      return {
        key: `initial-${index}-${row.schoolActivityId}`,
        activityId: row.schoolActivityId,
        durationMinutes: String(row.durationMinutes ?? activity?.durationMinutes ?? 1),
        ledBy: String(row.ledBy ?? activity?.ledBy ?? 1),
      }
    })
  )
  const [nextSelectionNumber, setNextSelectionNumber] = useState(initialRows.length + 1)
  const [drawerOpened, setDrawerOpened] = useState(false)
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(
    activityBank[0]?.id ?? null
  )
  const [search, setSearch] = useState('')
  const [draggedActivityKey, setDraggedActivityKey] = useState<string | null>(null)
  const selectedRows = selectedActivities.flatMap((selection) => {
    const activity = activityById.get(selection.activityId)
    return activity ? [{ selection, activity }] : []
  })
  const activityDuration = (selection: SelectedActivity) => {
    const value = Number(selection.durationMinutes)
    return Number.isFinite(value) && value >= 1 ? value : 1
  }
  const plannedMinutes = selectedActivities.reduce(
    (total, selection) => total + activityDuration(selection),
    0
  )
  const remainingMinutes = durationMinutes - plannedMinutes
  const progressValue =
    durationMinutes > 0 ? Math.min(100, Math.round((plannedMinutes / durationMinutes) * 100)) : 0
  const activeCategory = activityBank.find((category) => category.id === activeCategoryId)
  const normalizedSearch = search.trim().toLowerCase()
  const drawerActivities = allActivities.filter((activity) => {
    const inActiveCategory = activeCategoryId ? activity.categoryId === activeCategoryId : true
    const searchableText = [
      activity.name,
      activity.focusArea,
      activity.description,
      activity.successCue,
    ].flatMap((value) => (value ? [value] : []))
    const matchesSearch =
      normalizedSearch.length === 0 ||
      searchableText.some((value) => value.toLowerCase().includes(normalizedSearch))

    return inActiveCategory && matchesSearch
  })

  const addActivity = (activityId: number) => {
    const activity = activityById.get(activityId)
    setSelectedActivities((current) => [
      ...current,
      {
        key: `${activityId}-${nextSelectionNumber}`,
        activityId,
        durationMinutes: String(activity?.durationMinutes ?? 1),
        ledBy: String(activity?.ledBy ?? 1),
      },
    ])
    setNextSelectionNumber((current) => current + 1)
  }

  const removeActivity = (selectionKey: string) => {
    setSelectedActivities((current) =>
      current.filter((selection) => selection.key !== selectionKey)
    )
  }

  const setActivityDuration = (selectionKey: string, value: string) => {
    const numericValue = Number(value)
    const nextValue =
      value !== '' && Number.isFinite(numericValue) && numericValue < 1 ? '1' : value

    setSelectedActivities((current) =>
      current.map((selection) =>
        selection.key === selectionKey ? { ...selection, durationMinutes: nextValue } : selection
      )
    )
  }

  const setActivityLeader = (selectionKey: string, ledBy: string) => {
    setSelectedActivities((current) =>
      current.map((selection) =>
        selection.key === selectionKey ? { ...selection, ledBy } : selection
      )
    )
  }

  const clampActivityDuration = (selectionKey: string) => {
    setSelectedActivities((current) =>
      current.map((selection) => {
        if (selection.key !== selectionKey) {
          return selection
        }

        const numericValue = Number(selection.durationMinutes)
        return {
          ...selection,
          durationMinutes:
            Number.isFinite(numericValue) && numericValue >= 1 ? String(numericValue) : '1',
        }
      })
    )
  }

  const moveActivityBefore = (targetActivityKey: string) => {
    if (!draggedActivityKey || draggedActivityKey === targetActivityKey) {
      return
    }

    const draggedSelection = selectedActivities.find(
      (selection) => selection.key === draggedActivityKey
    )
    const targetSelection = selectedActivities.find(
      (selection) => selection.key === targetActivityKey
    )
    const draggedActivity = draggedSelection ? activityById.get(draggedSelection.activityId) : null
    const targetActivity = targetSelection ? activityById.get(targetSelection.activityId) : null
    if (
      !draggedActivity ||
      !targetActivity ||
      draggedActivity.categoryId !== targetActivity.categoryId
    ) {
      return
    }

    setSelectedActivities((current) => {
      const dragged = current.find((selection) => selection.key === draggedActivityKey)
      if (!dragged) {
        return current
      }

      const next = current.filter((selection) => selection.key !== draggedActivityKey)
      const targetIndex = next.findIndex((selection) => selection.key === targetActivityKey)
      if (targetIndex === -1) {
        return current
      }

      next.splice(targetIndex, 0, dragged)
      return next
    })
  }

  const openBank = (categoryId: number) => {
    setActiveCategoryId(categoryId)
    setSearch('')
    setDrawerOpened(true)
  }

  return (
    <Stack gap="sm">
      {selectedActivities.map((selection, index) => (
        <Fragment key={`activity-${selection.key}`}>
          <input type="hidden" name={`schoolActivityIds[${index}]`} value={selection.activityId} />
          <input
            type="hidden"
            name={`schoolActivityDurations[${index}]`}
            value={activityDuration(selection)}
          />
          <input type="hidden" name={`schoolActivityLedBys[${index}]`} value={selection.ledBy} />
        </Fragment>
      ))}

      <Group justify="space-between" align="flex-end" gap="md">
        <Text fw={700} size="sm">
          Lesson activities
        </Text>
        <Group gap="sm" style={{ flex: '1 1 280px', maxWidth: 360 }}>
          <Text
            size="xs"
            c={remainingMinutes < 0 ? 'red' : 'dimmed'}
            style={{ whiteSpace: 'nowrap' }}
          >
            {remainingMinutes >= 0
              ? `${remainingMinutes} min left`
              : `${Math.abs(remainingMinutes)} min over`}
          </Text>
          <Progress
            value={progressValue}
            color={remainingMinutes < 0 ? 'red' : 'aqua'}
            size="xs"
            radius="xl"
            style={{ flex: 1 }}
          />
          <Text size="xs" fw={700} style={{ whiteSpace: 'nowrap' }}>
            {plannedMinutes} / {durationMinutes} min
          </Text>
        </Group>
      </Group>

      {activityBank.map((category) => {
        const selectedForCategory = selectedRows.filter(
          ({ activity }) => activity.categoryId === category.id
        )

        return (
          <Box
            key={category.id}
            p="sm"
            style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8 }}
          >
            <Group justify="space-between" align="center" mb="xs">
              <Text size="sm" fw={700}>
                {category.name}
              </Text>
              <Text size="xs" c="dimmed">
                {category.activities.length} available
              </Text>
            </Group>

            {selectedForCategory.length === 0 ? (
              <Text size="xs" c="dimmed" mb="xs">
                Nothing planned yet.
              </Text>
            ) : (
              <Stack gap="xs" mb="xs">
                {selectedForCategory.map(({ selection, activity }) => (
                  <Group
                    key={selection.key}
                    justify="space-between"
                    align="flex-start"
                    gap="sm"
                    wrap="nowrap"
                    p="xs"
                    draggable
                    onDragStart={() => setDraggedActivityKey(selection.key)}
                    onDragEnd={() => setDraggedActivityKey(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => moveActivityBefore(selection.key)}
                    style={{
                      border: '1px solid var(--mantine-color-gray-2)',
                      borderRadius: 8,
                      background: 'white',
                      cursor: 'grab',
                    }}
                  >
                    <IconGripVertical
                      size={16}
                      color="var(--mantine-color-gray-5)"
                      style={{ flexShrink: 0, marginTop: 3 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={700}>
                        {activity.name}
                      </Text>
                      {activity.successCue && (
                        <Text size="xs" c="dimmed" mt={2}>
                          {activity.successCue}
                        </Text>
                      )}
                    </div>
                    <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
                      <SegmentedControl
                        size="xs"
                        aria-label={`${activity.name} leader`}
                        data={ACTIVITY_LEADERS}
                        value={selection.ledBy}
                        onChange={(value) => setActivityLeader(selection.key, value)}
                      />
                      <Group gap={4} wrap="nowrap">
                        <input
                          aria-label={`${activity.name} duration minutes`}
                          type="number"
                          min={1}
                          step={1}
                          required
                          value={selection.durationMinutes}
                          onChange={(event) =>
                            setActivityDuration(selection.key, event.currentTarget.value)
                          }
                          onBlur={() => clampActivityDuration(selection.key)}
                          style={{
                            width: 48,
                            border: '1px solid var(--mantine-color-gray-3)',
                            borderRadius: 6,
                            padding: '4px 6px',
                            textAlign: 'right',
                            fontSize: 12,
                            fontWeight: 800,
                            color: 'var(--mantine-color-aqua-8)',
                          }}
                        />
                        <Text size="xs" fw={800} c="aqua.8">
                          MIN
                        </Text>
                      </Group>
                    </Group>
                    <Tooltip label={`Remove ${activity.name}`}>
                      <ActionIcon
                        type="button"
                        variant="subtle"
                        color="red"
                        size="sm"
                        aria-label={`Remove ${activity.name}`}
                        onClick={() => removeActivity(selection.key)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                ))}
              </Stack>
            )}

            {selectedForCategory.length > 1 && (
              <Text size="xs" c="dimmed" mb="xs">
                Drag to reorder within this category.
              </Text>
            )}

            <Button
              type="button"
              variant="default"
              size="xs"
              fullWidth
              leftSection={<IconPlus size={14} />}
              onClick={() => openBank(category.id)}
              style={{ borderStyle: 'dashed' }}
            >
              Add to {category.name}
            </Button>
          </Box>
        )
      })}

      <Drawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        position="right"
        size="lg"
        title={
          <Text fw={800} size="lg">
            Activity bank
          </Text>
        }
        overlayProps={{ backgroundOpacity: 0.45 }}
      >
        <Stack gap="md">
          <TextInput
            aria-label="Search activity bank"
            placeholder={`Search in ${activeCategory?.name ?? 'all activities'}...`}
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
          />

          <Group gap="xs" wrap="nowrap" style={{ overflowX: 'auto' }}>
            <Button
              type="button"
              size="xs"
              variant={activeCategoryId === null ? 'filled' : 'default'}
              color={activeCategoryId === null ? 'dark' : 'gray'}
              onClick={() => setActiveCategoryId(null)}
            >
              All ({allActivities.length})
            </Button>
            {activityBank.map((category) => (
              <Button
                key={category.id}
                type="button"
                size="xs"
                variant={activeCategoryId === category.id ? 'filled' : 'default'}
                color={activeCategoryId === category.id ? 'dark' : 'gray'}
                onClick={() => setActiveCategoryId(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </Group>

          <Group justify="space-between">
            <Text size="xs" fw={800} tt="uppercase" c="dimmed" lts="0.05em">
              {drawerActivities.length} of {allActivities.length} activities
            </Text>
            <Text size="xs" c="dimmed">
              Adding to {activeCategory?.name ?? 'any category'}
            </Text>
          </Group>

          <Stack gap="xs">
            {drawerActivities.length === 0 ? (
              <Box
                p="md"
                style={{ border: '1px dashed var(--mantine-color-gray-4)', borderRadius: 8 }}
              >
                <Text size="sm" c="dimmed">
                  No activities match this search.
                </Text>
              </Box>
            ) : (
              drawerActivities.map((activity) => {
                const selectedCount = selectedActivities.filter(
                  (selection) => selection.activityId === activity.id
                ).length

                return (
                  <Group
                    key={activity.id}
                    justify="space-between"
                    align="flex-start"
                    gap="sm"
                    wrap="nowrap"
                    p="sm"
                    style={{
                      borderRadius: 8,
                      background: selectedCount > 0 ? 'var(--mantine-color-blue-0)' : undefined,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Group gap={6} align="center">
                        <Text size="sm" fw={700}>
                          {activity.name}
                        </Text>
                        {activeCategoryId === null && (
                          <Badge variant="light" color="gray" size="sm">
                            {activity.categoryName}
                          </Badge>
                        )}
                      </Group>
                      <Text size="xs" c="dimmed" mt={2}>
                        {activity.focusArea}
                        {activity.successCue ? ` · ${activity.successCue}` : ''}
                      </Text>
                      <Text size="xs" c="dimmed" mt={2}>
                        {activityLeaderLabel(activity.ledBy)}
                      </Text>
                    </div>
                    <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
                      {activity.durationMinutes && (
                        <Text size="xs" fw={800} c="aqua.8" style={{ whiteSpace: 'nowrap' }}>
                          {activity.durationMinutes} MIN
                        </Text>
                      )}
                      <Button
                        type="button"
                        size="xs"
                        variant={selectedCount > 0 ? 'default' : 'light'}
                        onClick={() => addActivity(activity.id)}
                      >
                        {selectedCount > 0 ? 'Add again' : 'Add'}
                      </Button>
                    </Group>
                  </Group>
                )
              })
            )}
          </Stack>
        </Stack>
      </Drawer>
    </Stack>
  )
}
