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
  Select,
  Stack,
  Text,
  Textarea,
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

type CustomActivity = {
  key: string
  categoryId: number
  categoryName: string
  name: string
  description: string
  successCue: string
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
  const [customActivities, setCustomActivities] = useState<CustomActivity[]>([])
  const [nextSelectionNumber, setNextSelectionNumber] = useState(initialRows.length + 1)
  const [drawerOpened, setDrawerOpened] = useState(false)
  const [customFormOpened, setCustomFormOpened] = useState(false)
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(
    activityBank[0]?.id ?? null
  )
  const [bankMode, setBankMode] = useState<'suggested' | 'all'>('suggested')
  const [search, setSearch] = useState('')
  const [draggedActivityKey, setDraggedActivityKey] = useState<string | null>(null)
  const [customDraft, setCustomDraft] = useState({
    name: '',
    categoryId: String(activityBank[0]?.id ?? ''),
    description: '',
    successCue: '',
    durationMinutes: '5',
    ledBy: '1',
  })
  const [customErrors, setCustomErrors] = useState<{ name?: string; categoryId?: string }>({})
  const selectedRows = [
    ...selectedActivities.flatMap((selection) => {
      const activity = activityById.get(selection.activityId)
      return activity ? [{ source: 'bank' as const, selection, activity }] : []
    }),
    ...customActivities.map((selection) => ({
      source: 'custom' as const,
      selection,
      activity: {
        categoryId: selection.categoryId,
        categoryName: selection.categoryName,
        name: selection.name,
        description: selection.description,
        successCue: selection.successCue,
        durationMinutes: Number(selection.durationMinutes),
        ledBy: Number(selection.ledBy),
      },
    })),
  ]
  const activityDuration = (selection: Pick<SelectedActivity, 'durationMinutes'>) => {
    const value = Number(selection.durationMinutes)
    return Number.isFinite(value) && value >= 1 ? value : 1
  }
  const plannedMinutes = [...selectedActivities, ...customActivities].reduce(
    (total, selection) => total + activityDuration(selection),
    0
  )
  const remainingMinutes = durationMinutes - plannedMinutes
  const progressValue =
    durationMinutes > 0 ? Math.min(100, Math.round((plannedMinutes / durationMinutes) * 100)) : 0
  const activeCategory = activityBank.find((category) => category.id === activeCategoryId)
  const isSuggestedActivity = (activity: ActivityWithCategory) =>
    Boolean(
      activity.levelId ||
      activity.levelStageId ||
      activity.levelStageSkillId ||
      activity.levelStageActivityId
    )
  const suggestedCountForCategory = (category: Data.SchoolActivityCategory) =>
    category.activities.filter((activity) =>
      isSuggestedActivity({
        ...activity,
        categoryId: category.id,
        categoryName: category.name,
      })
    ).length
  const suggestedActivitiesCount = allActivities.filter(isSuggestedActivity).length
  const normalizedSearch = search.trim().toLowerCase()
  const drawerActivities = allActivities.filter((activity) => {
    const inActiveCategory = activeCategoryId ? activity.categoryId === activeCategoryId : true
    const inBankMode = bankMode === 'all' || isSuggestedActivity(activity)
    const searchableText = [activity.name, activity.description, activity.successCue].flatMap(
      (value) => (value ? [value] : [])
    )
    const matchesSearch =
      normalizedSearch.length === 0 ||
      searchableText.some((value) => value.toLowerCase().includes(normalizedSearch))

    return inActiveCategory && inBankMode && matchesSearch
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
    setCustomActivities((current) => current.filter((selection) => selection.key !== selectionKey))
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
    setCustomActivities((current) =>
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
    setCustomActivities((current) =>
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
    setCustomActivities((current) =>
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
    const categoryHasSuggestions = allActivities.some(
      (activity) => activity.categoryId === categoryId && isSuggestedActivity(activity)
    )
    setBankMode(categoryHasSuggestions ? 'suggested' : 'all')
    setSearch('')
    setCustomDraft({
      name: '',
      categoryId: String(categoryId),
      description: '',
      successCue: '',
      durationMinutes: '5',
      ledBy: '1',
    })
    setCustomFormOpened(false)
    setCustomErrors({})
    setDrawerOpened(true)
  }

  const addCustomActivity = () => {
    const nextErrors: typeof customErrors = {}
    const categoryId = Number(customDraft.categoryId)
    const category = activityBank.find((item) => item.id === categoryId)
    if (!customDraft.name.trim()) nextErrors.name = 'This field is required'
    if (!category) nextErrors.categoryId = 'Choose a category'
    setCustomErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || !category) return

    const duration = Number(customDraft.durationMinutes)
    setCustomActivities((current) => [
      ...current,
      {
        key: `custom-${nextSelectionNumber}`,
        categoryId: category.id,
        categoryName: category.name,
        name: customDraft.name.trim(),
        description: customDraft.description.trim(),
        successCue: customDraft.successCue.trim(),
        durationMinutes: Number.isFinite(duration) && duration >= 1 ? String(duration) : '1',
        ledBy: customDraft.ledBy,
      },
    ])
    setNextSelectionNumber((current) => current + 1)
    setDrawerOpened(false)
    setCustomFormOpened(false)
    setCustomErrors({})
  }

  const closeBank = () => {
    setDrawerOpened(false)
    setCustomFormOpened(false)
    setCustomErrors({})
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
      {customActivities.map((activity, index) => (
        <Fragment key={`custom-activity-${activity.key}`}>
          <input type="hidden" name={`customActivityNames[${index}]`} value={activity.name} />
          <input
            type="hidden"
            name={`customActivityCategoryIds[${index}]`}
            value={activity.categoryId}
          />
          <input
            type="hidden"
            name={`customActivityDescriptions[${index}]`}
            value={activity.description}
          />
          <input
            type="hidden"
            name={`customActivitySuccessCues[${index}]`}
            value={activity.successCue}
          />
          <input
            type="hidden"
            name={`customActivityDurations[${index}]`}
            value={activityDuration(activity)}
          />
          <input type="hidden" name={`customActivityLedBys[${index}]`} value={activity.ledBy} />
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
                {suggestedCountForCategory(category)} suggested · {category.activities.length}{' '}
                available
              </Text>
            </Group>

            {selectedForCategory.length === 0 ? (
              <Text size="xs" c="dimmed" mb="xs">
                Nothing planned yet.
              </Text>
            ) : (
              <Stack gap="xs" mb="xs">
                {selectedForCategory.map(({ source, selection, activity }) => (
                  <Group
                    key={selection.key}
                    justify="space-between"
                    align="flex-start"
                    gap="sm"
                    wrap="nowrap"
                    p="xs"
                    draggable={source === 'bank'}
                    onDragStart={() => source === 'bank' && setDraggedActivityKey(selection.key)}
                    onDragEnd={() => setDraggedActivityKey(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => source === 'bank' && moveActivityBefore(selection.key)}
                    style={{
                      border: '1px solid var(--mantine-color-gray-2)',
                      borderRadius: 8,
                      background: 'white',
                      cursor: source === 'bank' ? 'grab' : 'default',
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
        onClose={closeBank}
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

          <Group gap="xs">
            <Button
              type="button"
              size="xs"
              variant={bankMode === 'suggested' ? 'filled' : 'default'}
              color={bankMode === 'suggested' ? 'dark' : 'gray'}
              onClick={() => setBankMode('suggested')}
            >
              Suggested ({suggestedActivitiesCount})
            </Button>
            <Button
              type="button"
              size="xs"
              variant={bankMode === 'all' ? 'filled' : 'default'}
              color={bankMode === 'all' ? 'dark' : 'gray'}
              onClick={() => setBankMode('all')}
            >
              All bank ({allActivities.length})
            </Button>
          </Group>

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
                onClick={() => {
                  setActiveCategoryId(category.id)
                  setCustomDraft((current) => ({ ...current, categoryId: String(category.id) }))
                }}
              >
                {category.name}
              </Button>
            ))}
          </Group>

          <Button
            type="button"
            variant="default"
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={() => setCustomFormOpened((current) => !current)}
          >
            {customFormOpened ? 'Hide custom activity' : 'Add custom activity'}
          </Button>

          {customFormOpened && (
            <Box
              p="sm"
              style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8 }}
            >
              <Text size="xs" fw={800} tt="uppercase" c="dimmed" lts="0.05em" mb="xs">
                Custom activity
              </Text>
              <Stack gap="xs">
                <Group align="flex-start" gap="xs">
                  <TextInput
                    label="Activity name"
                    size="xs"
                    flex={1}
                    value={customDraft.name}
                    onChange={(event) =>
                      setCustomDraft((current) => ({
                        ...current,
                        name: event.currentTarget.value,
                      }))
                    }
                    error={customErrors.name}
                  />
                  <Select
                    label="Category"
                    size="xs"
                    w={170}
                    data={activityBank.map((category) => ({
                      value: String(category.id),
                      label: category.name,
                    }))}
                    value={customDraft.categoryId}
                    onChange={(value) =>
                      setCustomDraft((current) => ({ ...current, categoryId: value ?? '' }))
                    }
                    error={customErrors.categoryId}
                    allowDeselect={false}
                  />
                </Group>
                <Group align="flex-start" gap="xs">
                  <TextInput
                    aria-label="Custom activity duration minutes"
                    label="Minutes"
                    type="number"
                    min={1}
                    step={1}
                    size="xs"
                    w={110}
                    value={customDraft.durationMinutes}
                    onChange={(event) =>
                      setCustomDraft((current) => ({
                        ...current,
                        durationMinutes: event.currentTarget.value,
                      }))
                    }
                    onBlur={() => {
                      const numericValue = Number(customDraft.durationMinutes)
                      if (!Number.isFinite(numericValue) || numericValue < 1) {
                        setCustomDraft((current) => ({ ...current, durationMinutes: '1' }))
                      }
                    }}
                  />
                  <SegmentedControl
                    size="xs"
                    aria-label="Custom activity leader"
                    data={ACTIVITY_LEADERS}
                    value={customDraft.ledBy}
                    onChange={(value) =>
                      setCustomDraft((current) => ({ ...current, ledBy: value }))
                    }
                    style={{ marginTop: 22 }}
                  />
                </Group>
                <Textarea
                  aria-label="Custom activity description"
                  label="Description"
                  size="xs"
                  autosize
                  minRows={2}
                  value={customDraft.description}
                  onChange={(event) =>
                    setCustomDraft((current) => ({
                      ...current,
                      description: event.currentTarget.value,
                    }))
                  }
                />
                <TextInput
                  aria-label="Custom activity success cue"
                  label="Success cue"
                  size="xs"
                  value={customDraft.successCue}
                  onChange={(event) =>
                    setCustomDraft((current) => ({
                      ...current,
                      successCue: event.currentTarget.value,
                    }))
                  }
                />
                <Group justify="flex-end">
                  <Button type="button" size="xs" onClick={addCustomActivity}>
                    Add activity
                  </Button>
                </Group>
              </Stack>
            </Box>
          )}

          <Group justify="space-between">
            <Text size="xs" fw={800} tt="uppercase" c="dimmed" lts="0.05em">
              {drawerActivities.length} of {allActivities.length} activities
            </Text>
            <Text size="xs" c="dimmed">
              {bankMode === 'suggested' ? 'Suggested for this class' : 'School bank'} · Adding to{' '}
              {activeCategory?.name ?? 'any category'}
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
                        {isSuggestedActivity(activity) && (
                          <Badge variant="light" color="aqua" size="sm">
                            Suggested
                          </Badge>
                        )}
                      </Group>
                      {activity.successCue && (
                        <Text size="xs" c="dimmed" mt={2}>
                          {activity.successCue}
                        </Text>
                      )}
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
