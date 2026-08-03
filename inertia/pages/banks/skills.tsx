import { useEffect, useMemo, useRef, useState } from 'react'
import { router } from '@inertiajs/react'
import {
  ActionIcon,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { IconCopy, IconPencil, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'
import { Form } from '@adonisjs/inertia/react'
import { urlFor } from '~/client'
import type { InertiaProps } from '~/types'

type Skill = {
  id: number
  schoolId: number | null
  sourceType: string
  sourceKey: string | null
  familyKey: string
  name: string
  description: string | null
  passCriteria: string | null
  position: number
  editable: boolean
}

type SkillFamily = {
  id: number
  familyKey: string
  displayName: string
  position: number
  linkedActivityCount: number
}

type PageProps = InertiaProps<{
  families: SkillFamily[]
  skills: Skill[]
}>

type SkillFormValues = Pick<Skill, 'familyKey' | 'name' | 'description' | 'passCriteria'>

type SkillFormMode =
  | { type: 'new'; key: number }
  | { type: 'edit'; id: number; key: number }
  | { type: 'duplicate'; skill: SkillFormValues; key: number }
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

function SkillForm({
  families,
  skill,
  draft,
  onCancel,
}: {
  families: SkillFamily[]
  skill?: Skill
  draft?: SkillFormValues
  onCancel: () => void
}) {
  const isEdit = Boolean(skill)
  const values = skill ?? draft

  return (
    <Card withBorder shadow="none" radius="md" p="md">
      <Form
        route={isEdit ? 'skill_bank.update' : 'skill_bank.store'}
        routeParams={isEdit ? { id: skill!.id } : undefined}
        onSuccess={onCancel}
      >
        {({ processing, errors }) => (
          <Stack gap="sm">
            <Text size="xs" tt="uppercase" fw={800} c="aqua.7">
              {isEdit ? 'Edit skill' : 'New skill'}
            </Text>
            <Group align="flex-start" gap="sm">
              <TextInput
                name="name"
                label="Skill name"
                placeholder="e.g. Back float"
                defaultValue={values?.name ?? ''}
                error={errors.name}
                flex={1}
                autoFocus
              />
              <Select
                name="familyKey"
                label="Skill family"
                data={families.map((family) => ({
                  value: family.familyKey,
                  label: family.displayName,
                }))}
                defaultValue={values?.familyKey ?? families[0]?.familyKey}
                error={errors.familyKey}
                w={220}
                allowDeselect={false}
              />
            </Group>
            <TextInput
              name="passCriteria"
              label="Pass criteria"
              placeholder="What does success look like?"
              defaultValue={values?.passCriteria ?? ''}
              error={errors.passCriteria}
            />
            <Textarea
              name="description"
              label="Description"
              placeholder="Focus area, learner outcome, or coach cue."
              defaultValue={values?.description ?? ''}
              error={errors.description}
              autosize
              minRows={2}
            />
            <Group justify="flex-end">
              <Button type="button" variant="default" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" loading={processing}>
                {isEdit ? 'Save skill' : 'Add skill'}
              </Button>
            </Group>
          </Stack>
        )}
      </Form>
    </Card>
  )
}

export default function SkillsBank({ families, skills }: PageProps) {
  const [activeFamilyKey, setActiveFamilyKey] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [formMode, setFormMode] = useState<SkillFormMode>(null)
  const [managingFamilies, setManagingFamilies] = useState(false)
  const [editingFamilyId, setEditingFamilyId] = useState<number | null>(null)
  const formRef = useRef<HTMLDivElement | null>(null)
  const activeFamily =
    activeFamilyKey === 'all'
      ? undefined
      : families.find((family) => family.familyKey === activeFamilyKey)

  useEffect(() => {
    if (!formMode) {
      return
    }

    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [formMode])

  const normalizedSearch = search.trim().toLowerCase()
  const filtered = skills.filter((skill) => {
    const familyDisplayName =
      families.find((family) => family.familyKey === skill.familyKey)?.displayName ??
      skill.familyKey
    const matchesFamily = activeFamilyKey === 'all' || skill.familyKey === activeFamilyKey
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [skill.name, familyDisplayName, skill.description, skill.passCriteria]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch))

    return matchesFamily && matchesSearch
  })
  const grouped = useMemo(
    () =>
      families
        .map((family) => ({
          family,
          skills: filtered.filter((skill) => skill.familyKey === family.familyKey),
        }))
        .filter((group) => group.skills.length > 0),
    [families, filtered]
  )
  const familyCounts = new Map(
    families.map((family) => [
      family.familyKey,
      skills.filter((skill) => skill.familyKey === family.familyKey).length,
    ])
  )
  const editSkill =
    formMode?.type === 'edit' ? skills.find((skill) => skill.id === formMode.id) : undefined
  const draftSkill = formMode?.type === 'duplicate' ? formMode.skill : undefined
  const deleteFamily = (family: SkillFamily) => {
    if (
      family.linkedActivityCount > 0 &&
      !confirm(
        `${family.displayName} has activities linked to skills in this family. Delete it anyway?`
      )
    ) {
      return
    }

    router.delete(urlFor('skill_bank_families.destroy', { id: family.id }))
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
                Skills bank
              </Title>
              <Text c="dimmed" size="sm">
                {skills.length} skills · {families.length} families
              </Text>
            </div>

            <Group justify="space-between">
              <Text size="xs" tt="uppercase" fw={800} c="dimmed">
                Families
              </Text>
              {managingFamilies ? (
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => {
                    setManagingFamilies(false)
                    setEditingFamilyId(null)
                  }}
                >
                  Done
                </Button>
              ) : (
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => {
                    setManagingFamilies(true)
                    setFormMode(null)
                  }}
                >
                  Manage
                </Button>
              )}
            </Group>

            {managingFamilies ? (
              <Stack gap={6}>
                <Button
                  variant={activeFamilyKey === 'all' ? 'light' : 'subtle'}
                  color={activeFamilyKey === 'all' ? 'blue' : 'gray'}
                  justify="space-between"
                  onClick={() => setActiveFamilyKey('all')}
                  rightSection={
                    <Text size="sm" fw={700}>
                      {skills.length}
                    </Text>
                  }
                >
                  All skills
                </Button>

                {families.map((family) =>
                  editingFamilyId === family.id ? (
                    <Form
                      key={family.id}
                      route="skill_bank_families.update"
                      routeParams={{ id: family.id }}
                    >
                      {({ processing, errors }) => (
                        <Stack gap={6}>
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
                              name="displayName"
                              aria-label={`Family name ${family.displayName}`}
                              defaultValue={family.displayName}
                              error={errors.displayName}
                              size="xs"
                              style={{ flex: 1 }}
                            />
                            <Button type="submit" size="xs" loading={processing}>
                              Save
                            </Button>
                          </Group>
                        </Stack>
                      )}
                    </Form>
                  ) : (
                    <Group
                      key={family.id}
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
                        {family.displayName}
                      </Text>
                      <Text c="dimmed" size="sm">
                        {familyCounts.get(family.familyKey)}
                      </Text>
                      <Tooltip label="Rename family">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          aria-label={`Rename ${family.displayName}`}
                          onClick={() => setEditingFamilyId(family.id)}
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip
                        label={
                          family.linkedActivityCount > 0
                            ? 'Delete family with linked activities'
                            : 'Delete family'
                        }
                      >
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          aria-label={`Delete ${family.displayName}`}
                          onClick={() => deleteFamily(family)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  )
                )}

                <Form route="skill_bank_families.store">
                  {({ processing, errors }) => (
                    <Stack gap={6}>
                      <Group
                        gap={6}
                        wrap="nowrap"
                        bg="gray.0"
                        p={8}
                        style={{
                          border: '1px dashed var(--mantine-color-gray-4)',
                          borderRadius: 'var(--mantine-radius-md)',
                        }}
                      >
                        <TextInput
                          name="displayName"
                          aria-label="Add family"
                          placeholder="Add family"
                          error={errors.displayName}
                          size="xs"
                          style={{ flex: 1 }}
                        />
                        <ActionIcon
                          type="submit"
                          loading={processing}
                          variant="light"
                          aria-label="Add family"
                        >
                          <IconPlus size={16} />
                        </ActionIcon>
                      </Group>
                    </Stack>
                  )}
                </Form>
              </Stack>
            ) : (
              <Stack gap={4}>
                {[{ familyKey: 'all', displayName: 'All skills' }, ...families].map((family) => {
                  const active = activeFamilyKey === family.familyKey
                  const count =
                    family.familyKey === 'all' ? skills.length : familyCounts.get(family.familyKey)
                  return (
                    <Button
                      key={family.familyKey}
                      variant={active ? 'light' : 'subtle'}
                      color={active ? 'blue' : 'gray'}
                      justify="space-between"
                      onClick={() => setActiveFamilyKey(family.familyKey)}
                      rightSection={
                        <Text size="sm" fw={700}>
                          {count}
                        </Text>
                      }
                    >
                      {family.displayName}
                    </Button>
                  )
                })}
              </Stack>
            )}
          </Stack>
        </Box>

        <Box flex={1} p="xl">
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={2}>{activeFamily?.displayName ?? 'All skills'}</Title>
                <Text c="dimmed" size="sm">
                  Add, edit, and organise the learner outcomes stages draw from.
                </Text>
              </div>
            </Group>

            <Group gap="sm" align="center">
              <TextInput
                placeholder="Search skills..."
                leftSection={<IconSearch size={18} />}
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                style={{ flex: '1 1 360px' }}
              />
              <Button
                leftSection={<IconPlus size={18} />}
                onClick={() => setFormMode({ type: 'new', key: Date.now() })}
              >
                New skill
              </Button>
            </Group>

            {formMode && (
              <div ref={formRef}>
                <SkillForm
                  key={formMode.key}
                  families={families}
                  skill={editSkill}
                  draft={draftSkill}
                  onCancel={() => setFormMode(null)}
                />
              </div>
            )}

            {grouped.length === 0 ? (
              <Card withBorder>
                <Text c="dimmed">No skills match these filters.</Text>
              </Card>
            ) : (
              grouped.map((group) => (
                <Stack key={group.family.familyKey} gap="xs">
                  <Group gap="sm">
                    <Text fw={800}>{group.family.displayName}</Text>
                    <Text c="dimmed" size="sm">
                      {group.skills.length} skills
                    </Text>
                    <Divider style={{ flex: 1 }} />
                  </Group>

                  <Card withBorder padding={0} radius="md">
                    {group.skills.map((skill, index) => (
                      <Box
                        key={skill.id}
                        p="md"
                        style={{
                          borderTop:
                            index === 0 ? undefined : '1px solid var(--mantine-color-gray-2)',
                        }}
                      >
                        <Group justify="space-between" wrap="nowrap" align="flex-start">
                          <Group gap="sm" align="flex-start" wrap="nowrap">
                            <div>
                              <Group gap="xs">
                                <Text fw={800}>{skill.name}</Text>
                              </Group>
                              <Text c="dimmed" size="sm" mt={4}>
                                {skill.description || 'No description yet.'}
                              </Text>
                              {skill.passCriteria && (
                                <Text size="xs" c="dimmed" mt={4}>
                                  Pass: {skill.passCriteria}
                                </Text>
                              )}
                            </div>
                          </Group>
                          <Group gap={4} wrap="nowrap">
                            <Tooltip label="Duplicate skill">
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                aria-label={`Duplicate ${skill.name}`}
                                onClick={() =>
                                  setFormMode({
                                    type: 'duplicate',
                                    key: Date.now(),
                                    skill: {
                                      familyKey: skill.familyKey,
                                      name: copyName(
                                        skill.name,
                                        skills.map((candidate) => candidate.name)
                                      ),
                                      description: skill.description,
                                      passCriteria: skill.passCriteria,
                                    },
                                  })
                                }
                              >
                                <IconCopy size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip
                              label={
                                skill.editable
                                  ? 'Edit skill'
                                  : skill.sourceType === 'pack'
                                    ? 'Pro pack skill'
                                    : 'Starter bank skill'
                              }
                            >
                              <ActionIcon
                                variant="subtle"
                                disabled={!skill.editable}
                                onClick={() =>
                                  setFormMode({ type: 'edit', id: skill.id, key: Date.now() })
                                }
                                aria-label={`Edit ${skill.name}`}
                              >
                                <IconPencil size={16} />
                              </ActionIcon>
                            </Tooltip>
                            {skill.editable && (
                              <Form route="skill_bank.destroy" routeParams={{ id: skill.id }}>
                                {({ processing }) => (
                                  <Tooltip label="Remove skill">
                                    <ActionIcon
                                      type="submit"
                                      variant="subtle"
                                      color="red"
                                      loading={processing}
                                      aria-label={`Remove ${skill.name}`}
                                    >
                                      <IconTrash size={16} />
                                    </ActionIcon>
                                  </Tooltip>
                                )}
                              </Form>
                            )}
                          </Group>
                        </Group>
                      </Box>
                    ))}
                  </Card>
                </Stack>
              ))
            )}
          </Stack>
        </Box>
      </Group>
    </Container>
  )
}
