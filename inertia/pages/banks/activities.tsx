import { Fragment, type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { router } from '@inertiajs/react'
import {
  ActionIcon,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import {
  IconCopy,
  IconEyeOff,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react'
import { Form } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'

type AgeGroup = {
  id: number
  displayName: string
  minAgeYear: number | null
  maxAgeYear: number | null
  position: number
}

type SkillOption = {
  id: number
  family: string
  name: string
  sourceType: string
}

type ActivityTags = Record<
  number,
  {
    ageGroupIds: number[]
    skillBankSkillIds: number[]
  }
>

type PageProps = InertiaProps<{
  categories: Data.SchoolActivityCategory[]
  ageGroups: AgeGroup[]
  skills: SkillOption[]
  activityTags: ActivityTags
  leaderOptions: { value: number; label: string }[]
}>

type Activity = Data.SchoolActivityCategory['activities'][number] & {
  categoryName: string
}

type ActivityFormValues = Pick<
  Activity,
  | 'schoolActivityCategoryId'
  | 'name'
  | 'ledBy'
  | 'description'
  | 'equipment'
  | 'safetyNotes'
  | 'successCue'
  | 'durationMinutes'
>

type ActivityFormMode =
  | { type: 'new'; key: number }
  | { type: 'edit'; id: number; key: number }
  | { type: 'duplicate'; activity: ActivityFormValues; key: number }
  | null

function copyName(baseName: string, existingNames: string[]) {
  const copyBase = `${baseName} copy`
  let candidate = copyBase
  let suffix = 2
  const normalizedNames = new Set(existingNames.map((name) => name.toLowerCase()))

  while (normalizedNames.has(candidate.toLowerCase())) {
    candidate = `${copyBase} ${suffix}`
    suffix += 1
  }

  return candidate
}

function hiddenArray(name: string, values: string[]) {
  return values.map((value, index) => (
    <input
      key={`${name}-${value}-${index}`}
      type="hidden"
      name={`${name}[${index}]`}
      value={value}
    />
  ))
}

function ActivityForm({
  categories,
  ageGroups,
  skills,
  leaderOptions,
  activity,
  draft,
  tags,
  onCancel,
}: {
  categories: Data.SchoolActivityCategory[]
  ageGroups: AgeGroup[]
  skills: SkillOption[]
  leaderOptions: { value: number; label: string }[]
  activity?: Activity
  draft?: ActivityFormValues
  tags?: { ageGroupIds: number[]; skillBankSkillIds: number[] }
  onCancel: () => void
}) {
  const [ageGroupIds, setAgeGroupIds] = useState((tags?.ageGroupIds ?? []).map(String))
  const [skillIds, setSkillIds] = useState((tags?.skillBankSkillIds ?? []).map(String))
  const isEdit = Boolean(activity)
  const values = activity ?? draft

  return (
    <Card withBorder shadow="none" radius="md" p="md">
      <Form
        route={isEdit ? 'activity_bank.update' : 'activity_bank.store'}
        routeParams={isEdit ? { id: activity!.id } : undefined}
        onSuccess={onCancel}
      >
        {({ processing, errors }) => (
          <Stack gap="sm">
            <Text size="xs" tt="uppercase" fw={800} c="aqua.7">
              {isEdit ? 'Edit activity' : 'New activity'}
            </Text>
            <Group align="flex-start" gap="sm">
              <TextInput
                name="name"
                label="Activity name"
                defaultValue={values?.name ?? ''}
                error={errors.name}
                flex={1}
                autoFocus
              />
              <Select
                name="schoolActivityCategoryId"
                label="Category"
                data={categories.map((category) => ({
                  value: String(category.id),
                  label: category.name,
                }))}
                defaultValue={String(values?.schoolActivityCategoryId ?? categories[0]?.id ?? '')}
                error={errors.schoolActivityCategoryId}
                w={190}
                allowDeselect={false}
              />
              <Select
                name="ledBy"
                label="Led by"
                data={leaderOptions.map((option) => ({
                  value: String(option.value),
                  label: option.label,
                }))}
                defaultValue={String(values?.ledBy ?? 1)}
                error={errors.ledBy}
                w={170}
                allowDeselect={false}
              />
              <NumberInput
                name="durationMinutes"
                label="Minutes"
                defaultValue={values?.durationMinutes ?? 5}
                min={1}
                error={errors.durationMinutes}
                w={120}
              />
            </Group>
            <Textarea
              name="description"
              label="Description"
              defaultValue={values?.description ?? ''}
              error={errors.description}
              autosize
              minRows={2}
            />
            <Group align="flex-start" gap="sm">
              <MultiSelect
                label="Applicable ages"
                data={ageGroups.map((group) => ({
                  value: String(group.id),
                  label: group.displayName,
                }))}
                value={ageGroupIds}
                onChange={setAgeGroupIds}
                placeholder="All ages if empty"
                flex={1}
              />
              <MultiSelect
                label="Linked skills"
                data={skills.map((skill) => ({
                  value: String(skill.id),
                  label: `${skill.name} · ${skill.family}`,
                }))}
                value={skillIds}
                onChange={setSkillIds}
                searchable
                flex={1}
              />
            </Group>
            <Group align="flex-start" gap="sm">
              <TextInput
                name="equipment"
                label="Equipment"
                defaultValue={values?.equipment ?? ''}
                error={errors.equipment}
                flex={1}
              />
              <TextInput
                name="successCue"
                label="Success cue"
                defaultValue={values?.successCue ?? ''}
                error={errors.successCue}
                flex={1}
              />
            </Group>
            <Textarea
              name="safetyNotes"
              label="Safety notes"
              defaultValue={values?.safetyNotes ?? ''}
              error={errors.safetyNotes}
              autosize
              minRows={2}
            />
            {hiddenArray('ageGroupIds', ageGroupIds)}
            {hiddenArray('skillBankSkillIds', skillIds)}
            <Group justify="flex-end">
              <Button type="button" variant="default" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" loading={processing}>
                {isEdit ? 'Save activity' : 'Add activity'}
              </Button>
            </Group>
          </Stack>
        )}
      </Form>
    </Card>
  )
}

export default function ActivityBank({
  categories,
  ageGroups,
  skills,
  activityTags,
  leaderOptions,
}: PageProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all')
  const [search, setSearch] = useState('')
  const [formMode, setFormMode] = useState<ActivityFormMode>(null)
  const [managingCategories, setManagingCategories] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [pendingCategoryId, setPendingCategoryId] = useState<number | null>(null)
  const formRef = useRef<HTMLDivElement | null>(null)
  const allActivities: Activity[] = categories.flatMap((category) =>
    category.activities.map((activity) => ({ ...activity, categoryName: category.name }))
  )

  useEffect(() => {
    if (!formMode) {
      return
    }

    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [formMode])

  const normalizedSearch = search.trim().toLowerCase()
  const filtered = allActivities.filter((activity) => {
    const matchesCategory =
      activeCategoryId === 'all' || activity.schoolActivityCategoryId === activeCategoryId
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [activity.name, activity.description, activity.successCue]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch))

    return matchesCategory && matchesSearch
  })
  const grouped = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          activities: filtered.filter(
            (activity) => activity.schoolActivityCategoryId === category.id
          ),
        }))
        .filter((group) => group.activities.length > 0),
    [categories, filtered]
  )
  const editActivity =
    formMode?.type === 'edit'
      ? allActivities.find((activity) => activity.id === formMode.id)
      : undefined
  const draftActivity = formMode?.type === 'duplicate' ? formMode.activity : undefined
  const categoryCounts = new Map(
    categories.map((category) => [category.id, category.activities.length])
  )
  const skillById = new Map(skills.map((skill) => [skill.id, skill]))
  const ageGroupById = new Map(ageGroups.map((group) => [group.id, group]))
  const renameCategory = (event: FormEvent<HTMLFormElement>, categoryId: number) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    router.patch(`/activity-bank-categories/${categoryId}`, formData, {
      preserveScroll: true,
      onStart: () => setPendingCategoryId(categoryId),
      onFinish: () => setPendingCategoryId(null),
      onSuccess: () => setEditingCategoryId(null),
    })
  }

  const disableCategory = (categoryId: number) => {
    router.delete(`/activity-bank-categories/${categoryId}`, {
      preserveScroll: true,
      onStart: () => setPendingCategoryId(categoryId),
      onFinish: () => setPendingCategoryId(null),
    })
  }

  return (
    <Container size="xl" py="xl">
      <Group align="stretch" gap={0} wrap="nowrap">
        <Box
          w={300}
          bg="white"
          p="lg"
          style={{ borderRight: '1px solid var(--mantine-color-gray-2)' }}
        >
          <Stack gap="md">
            <div>
              <Title order={1} fz="h2">
                Activity bank
              </Title>
              <Text c="dimmed" size="sm">
                {allActivities.length} activities · {categories.length} categories
              </Text>
            </div>

            <Group justify="space-between">
              <Text size="xs" tt="uppercase" fw={800} c="dimmed">
                Categories
              </Text>
              {managingCategories ? (
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => {
                    setManagingCategories(false)
                    setEditingCategoryId(null)
                  }}
                >
                  Done
                </Button>
              ) : (
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => {
                    setManagingCategories(true)
                    setFormMode(null)
                  }}
                >
                  Manage
                </Button>
              )}
            </Group>
            <Stack gap={4}>
              <Button
                variant={activeCategoryId === 'all' ? 'light' : 'subtle'}
                color={activeCategoryId === 'all' ? 'blue' : 'gray'}
                justify="space-between"
                onClick={() => setActiveCategoryId('all')}
                rightSection={
                  <Text size="sm" fw={700}>
                    {allActivities.length}
                  </Text>
                }
              >
                All activities
              </Button>
              {categories.map((category) =>
                managingCategories ? (
                  editingCategoryId === category.id ? (
                    <Box
                      component="form"
                      key={category.id}
                      onSubmit={(event) => renameCategory(event, category.id)}
                    >
                      <Group
                        gap={6}
                        wrap="nowrap"
                        bg="gray.0"
                        p={8}
                        style={{
                          border: '1px solid var(--mantine-color-gray-2)',
                          borderRadius: 'var(--mantine-radius-md)',
                        }}
                      >
                        <TextInput
                          name="name"
                          aria-label={`Category name ${category.name}`}
                          defaultValue={category.name}
                          size="xs"
                          style={{ flex: 1 }}
                          autoFocus
                        />
                        <Button type="submit" size="xs" loading={pendingCategoryId === category.id}>
                          Save
                        </Button>
                      </Group>
                    </Box>
                  ) : (
                    <Group
                      key={category.id}
                      gap="xs"
                      wrap="nowrap"
                      bg="gray.0"
                      p="xs"
                      style={{
                        border: '1px solid var(--mantine-color-gray-2)',
                        borderRadius: 'var(--mantine-radius-md)',
                      }}
                    >
                      <Text fw={800} c="dark.7" style={{ flex: 1 }}>
                        {category.name}
                      </Text>
                      <Text c="dimmed" size="sm">
                        {categoryCounts.get(category.id)}
                      </Text>
                      <Tooltip label="Rename category">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          aria-label={`Rename ${category.name}`}
                          onClick={() => setEditingCategoryId(category.id)}
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Disable category">
                        <ActionIcon
                          type="button"
                          variant="subtle"
                          color="gray"
                          loading={pendingCategoryId === category.id}
                          aria-label={`Disable ${category.name}`}
                          onClick={() => disableCategory(category.id)}
                        >
                          <IconEyeOff size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  )
                ) : (
                  <Button
                    key={category.id}
                    variant={activeCategoryId === category.id ? 'light' : 'subtle'}
                    color={activeCategoryId === category.id ? 'blue' : 'gray'}
                    justify="space-between"
                    onClick={() => setActiveCategoryId(category.id)}
                    rightSection={
                      <Text size="sm" fw={700}>
                        {categoryCounts.get(category.id)}
                      </Text>
                    }
                  >
                    {category.name}
                  </Button>
                )
              )}
            </Stack>
          </Stack>
        </Box>

        <Box flex={1} p="xl">
          <Stack gap="lg">
            <div>
              <Title order={2}>
                {activeCategoryId === 'all'
                  ? 'All activities'
                  : categories.find((category) => category.id === activeCategoryId)?.name}
              </Title>
              <Text c="dimmed" size="sm">
                Add, edit, and target lesson activities by age group and skill.
              </Text>
            </div>

            <Group gap="sm" align="center">
              <TextInput
                placeholder="Search activities..."
                leftSection={<IconSearch size={18} />}
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                style={{ flex: '1 1 360px' }}
              />
              <Button
                leftSection={<IconPlus size={18} />}
                onClick={() => setFormMode({ type: 'new', key: Date.now() })}
              >
                New activity
              </Button>
            </Group>

            {formMode && (
              <div ref={formRef}>
                <ActivityForm
                  key={formMode.key}
                  categories={categories}
                  ageGroups={ageGroups}
                  skills={skills}
                  leaderOptions={leaderOptions}
                  activity={editActivity}
                  draft={draftActivity}
                  tags={editActivity ? activityTags[editActivity.id] : undefined}
                  onCancel={() => setFormMode(null)}
                />
              </div>
            )}

            {grouped.length === 0 ? (
              <Card withBorder>
                <Text c="dimmed">No activities match these filters.</Text>
              </Card>
            ) : (
              grouped.map((group) => (
                <Stack key={group.category.id} gap="xs">
                  <Group gap="sm">
                    <Text fw={800}>{group.category.name}</Text>
                    <Text c="dimmed" size="sm">
                      {group.activities.length} activities
                    </Text>
                    <Divider style={{ flex: 1 }} />
                  </Group>
                  <Card withBorder padding={0} radius="md">
                    {group.activities.map((activity, index) => {
                      const tags = activityTags[activity.id] ?? {
                        ageGroupIds: [],
                        skillBankSkillIds: [],
                      }
                      const ageLabels = tags.ageGroupIds
                        .map((id) => ageGroupById.get(id)?.displayName)
                        .filter(Boolean)
                      const skillLabels = tags.skillBankSkillIds
                        .map((id) => skillById.get(id)?.name)
                        .filter(Boolean)

                      return (
                        <Box
                          key={activity.id}
                          p="md"
                          style={{
                            borderTop:
                              index === 0 ? undefined : '1px solid var(--mantine-color-gray-2)',
                          }}
                        >
                          <Group justify="space-between" wrap="nowrap" align="flex-start">
                            <Group gap="sm" align="flex-start" wrap="nowrap">
                              <div>
                                <Group gap="xs" wrap="wrap">
                                  <Text fw={800}>{activity.name}</Text>
                                  <Text c="dimmed" size="sm">
                                    {activity.durationMinutes ?? 1} min
                                  </Text>
                                </Group>
                                <Text c="dimmed" size="sm" mt={4}>
                                  {activity.description || 'No description yet.'}
                                </Text>
                                <Text c="dimmed" size="sm" mt="xs">
                                  <Text span fw={700} c="dark.5">
                                    Ages:
                                  </Text>{' '}
                                  {ageLabels.length > 0 ? ageLabels.join(', ') : 'All ages'}
                                  {' · '}
                                  <Text span fw={700} c="dark.5">
                                    Skills:
                                  </Text>{' '}
                                  {skillLabels.length > 0
                                    ? skillLabels.join(', ')
                                    : 'No linked skills'}
                                </Text>
                              </div>
                            </Group>
                            <Group gap={4} wrap="nowrap">
                              <Tooltip label="Duplicate activity">
                                <ActionIcon
                                  variant="subtle"
                                  color="gray"
                                  aria-label={`Duplicate ${activity.name}`}
                                  onClick={() =>
                                    setFormMode({
                                      type: 'duplicate',
                                      key: Date.now(),
                                      activity: {
                                        schoolActivityCategoryId: activity.schoolActivityCategoryId,
                                        name: copyName(
                                          activity.name,
                                          allActivities.map((candidate) => candidate.name)
                                        ),
                                        ledBy: activity.ledBy,
                                        description: activity.description,
                                        equipment: activity.equipment,
                                        safetyNotes: activity.safetyNotes,
                                        successCue: activity.successCue,
                                        durationMinutes: activity.durationMinutes,
                                      },
                                    })
                                  }
                                >
                                  <IconCopy size={16} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Edit activity">
                                <ActionIcon
                                  variant="subtle"
                                  onClick={() =>
                                    setFormMode({
                                      type: 'edit',
                                      id: activity.id,
                                      key: Date.now(),
                                    })
                                  }
                                  aria-label={`Edit ${activity.name}`}
                                >
                                  <IconPencil size={16} />
                                </ActionIcon>
                              </Tooltip>
                              <Form route="activity_bank.destroy" routeParams={{ id: activity.id }}>
                                {({ processing }) => (
                                  <Tooltip label="Remove activity">
                                    <ActionIcon
                                      type="submit"
                                      variant="subtle"
                                      color="red"
                                      loading={processing}
                                      aria-label={`Remove ${activity.name}`}
                                    >
                                      <IconTrash size={16} />
                                    </ActionIcon>
                                  </Tooltip>
                                )}
                              </Form>
                            </Group>
                          </Group>
                        </Box>
                      )
                    })}
                  </Card>
                </Stack>
              ))
            )}

            <Fragment />
          </Stack>
        </Box>
      </Group>
    </Container>
  )
}
