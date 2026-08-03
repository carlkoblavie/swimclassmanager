import { useState } from 'react'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Drawer,
  Group,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Tooltip,
} from '@mantine/core'
import { IconPencil, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'
import type { StageDraft, StageSkillDraft } from '~/components/stage_builder'

const upperLabel = { tt: 'uppercase', fz: 'xs', c: 'dimmed', fw: 600 } as const

export type SkillBankOption = {
  id: number
  familyKey: string
  familyName: string
  name: string
  description: string | null
  passCriteria: string | null
}

type SkillPopoverProps = {
  existingNames: string[]
  skillOptions?: SkillBankOption[]
  initial?: StageSkillDraft
  submitLabel?: string
  onSubmit: (skill: StageSkillDraft) => void
  trigger: (open: () => void) => React.ReactNode
}

const BASIC_SKILL_FAMILIES = [
  { value: 'propulsion', label: 'Propulsion' },
  { value: 'stroke_technique', label: 'Stroke Technique' },
  { value: 'water_comfort_orientation', label: 'Water Comfort / Orientation' },
  { value: 'water_safety_survival', label: 'Water Safety / Survival' },
]

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

function normaliseSkillName(name: string) {
  return name.trim().toLowerCase()
}

function skillFamilyOptions(skillOptions: SkillBankOption[]) {
  const byKey = new Map<string, string>()
  for (const family of BASIC_SKILL_FAMILIES) {
    byKey.set(family.value, family.label)
  }
  for (const skill of skillOptions) {
    byKey.set(skill.familyKey, skill.familyName)
  }

  return [...byKey.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

function SkillBankDrawer({
  existingNames,
  skillOptions,
  onSubmit,
  trigger,
}: {
  existingNames: string[]
  skillOptions: SkillBankOption[]
  onSubmit: (skill: StageSkillDraft) => void
  trigger: (open: () => void) => React.ReactNode
}) {
  const [opened, setOpened] = useState(false)
  const [search, setSearch] = useState('')
  const [activeFamily, setActiveFamily] = useState<string | null>(null)
  const [customFormOpened, setCustomFormOpened] = useState(false)
  const familyOptions = skillFamilyOptions(skillOptions)
  const [entry, setEntry] = useState({
    familyKey: familyOptions[0]?.value ?? '',
    name: '',
    passCriteria: '',
    description: '',
  })
  const [errors, setErrors] = useState<{
    name?: string
    familyKey?: string
    passCriteria?: string
  }>({})

  const existingNameSet = new Set(existingNames.map(normaliseSkillName))
  const normalizedSearch = search.trim().toLowerCase()
  const filteredSkills = skillOptions.filter((skill) => {
    const matchesFamily = !activeFamily || skill.familyKey === activeFamily
    const searchableText = [skill.name, skill.familyName, skill.description, skill.passCriteria]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    const matchesSearch = normalizedSearch.length === 0 || searchableText.includes(normalizedSearch)

    return matchesFamily && matchesSearch
  })

  const resetCustomForm = () => {
    setEntry({
      familyKey: familyOptions[0]?.value ?? '',
      name: '',
      passCriteria: '',
      description: '',
    })
    setErrors({})
  }

  const openDrawer = () => {
    setSearch('')
    setActiveFamily(null)
    setCustomFormOpened(false)
    resetCustomForm()
    setOpened(true)
  }

  const closeDrawer = () => {
    setOpened(false)
    setCustomFormOpened(false)
    resetCustomForm()
  }

  const addBankSkill = (skill: SkillBankOption) => {
    if (existingNameSet.has(normaliseSkillName(skill.name)) || !skill.passCriteria?.trim()) {
      return
    }

    onSubmit({
      name: skill.name,
      familyKey: skill.familyKey,
      familyName: skill.familyName,
      passCriteria: skill.passCriteria,
      description: skill.description ?? '',
      activities: [],
    })
    closeDrawer()
  }

  const addCustomSkill = () => {
    const next: typeof errors = {}
    if (!entry.name.trim()) {
      next.name = 'This field is required'
    } else if (existingNameSet.has(normaliseSkillName(entry.name))) {
      next.name = 'A skill with this name already exists.'
    }
    if (!entry.familyKey) next.familyKey = 'Choose a skill family'
    if (!entry.passCriteria.trim()) next.passCriteria = 'This field is required'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSubmit({
      ...entry,
      familyName: familyOptions.find((family) => family.value === entry.familyKey)?.label,
      activities: [],
    })
    closeDrawer()
  }

  return (
    <>
      {trigger(openDrawer)}
      <Drawer
        opened={opened}
        onClose={closeDrawer}
        position="right"
        size="lg"
        title={
          <Text fw={800} size="lg">
            Skills bank
          </Text>
        }
        overlayProps={{ backgroundOpacity: 0.45 }}
      >
        <Stack gap="md">
          <TextInput
            aria-label="Search skills bank"
            placeholder="Search skills..."
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
          />

          <Group gap="xs" wrap="nowrap" style={{ overflowX: 'auto' }}>
            <Button
              type="button"
              size="xs"
              variant={activeFamily === null ? 'filled' : 'default'}
              color={activeFamily === null ? 'dark' : 'gray'}
              onClick={() => setActiveFamily(null)}
            >
              All ({skillOptions.length})
            </Button>
            {familyOptions.map((family) => (
              <Button
                key={family.value}
                type="button"
                size="xs"
                variant={activeFamily === family.value ? 'filled' : 'default'}
                color={activeFamily === family.value ? 'dark' : 'gray'}
                onClick={() => setActiveFamily(family.value)}
              >
                {family.label}
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
            {customFormOpened ? 'Hide custom skill' : 'Add custom skill'}
          </Button>

          {customFormOpened && (
            <Box
              p="sm"
              style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8 }}
            >
              <Text size="xs" fw={800} tt="uppercase" c="dimmed" lts="0.05em" mb="xs">
                Custom skill
              </Text>
              <Stack gap="xs">
                <Group align="flex-start" gap="xs">
                  <TextInput
                    label="Skill name"
                    labelProps={upperLabel}
                    size="xs"
                    placeholder="e.g. Back Float"
                    value={entry.name}
                    onChange={(event) => setEntry({ ...entry, name: event.currentTarget.value })}
                    error={errors.name}
                    flex={1}
                  />
                  <Select
                    label="Skill family"
                    labelProps={upperLabel}
                    size="xs"
                    data={familyOptions}
                    value={entry.familyKey}
                    onChange={(value) => setEntry({ ...entry, familyKey: value ?? '' })}
                    error={errors.familyKey}
                    w={220}
                    allowDeselect={false}
                  />
                </Group>
                <TextInput
                  label="Pass criteria"
                  labelProps={upperLabel}
                  size="xs"
                  placeholder="e.g. 10 seconds unassisted"
                  value={entry.passCriteria}
                  onChange={(event) =>
                    setEntry({ ...entry, passCriteria: event.currentTarget.value })
                  }
                  error={errors.passCriteria}
                />
                <Textarea
                  label="Skill description (optional)"
                  labelProps={upperLabel}
                  size="xs"
                  autosize
                  minRows={2}
                  value={entry.description}
                  onChange={(event) =>
                    setEntry({ ...entry, description: event.currentTarget.value })
                  }
                />
                <Group justify="flex-end">
                  <Button type="button" size="xs" onClick={addCustomSkill}>
                    Add
                  </Button>
                </Group>
              </Stack>
            </Box>
          )}

          <Group justify="space-between">
            <Text size="xs" fw={800} tt="uppercase" c="dimmed" lts="0.05em">
              {filteredSkills.length} of {skillOptions.length} skills
            </Text>
            <Text size="xs" c="dimmed">
              Add a bank skill to this stage
            </Text>
          </Group>

          <Stack gap="xs">
            {filteredSkills.length === 0 ? (
              <Box
                p="md"
                style={{ border: '1px dashed var(--mantine-color-gray-4)', borderRadius: 8 }}
              >
                <Text size="sm" c="dimmed">
                  No skills match this search.
                </Text>
              </Box>
            ) : (
              filteredSkills.map((skill) => {
                const alreadyAdded = existingNameSet.has(normaliseSkillName(skill.name))
                const missingPassCriteria = !skill.passCriteria?.trim()

                return (
                  <Group
                    key={skill.id}
                    justify="space-between"
                    align="flex-start"
                    gap="sm"
                    wrap="nowrap"
                    p="sm"
                    style={{
                      borderRadius: 8,
                      background: alreadyAdded ? 'var(--mantine-color-blue-0)' : undefined,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Group gap={6} align="center">
                        <Text size="sm" fw={700}>
                          {skill.name}
                        </Text>
                        <Badge variant="light" color="gray" size="sm">
                          {skill.familyName}
                        </Badge>
                      </Group>
                      {skill.description && (
                        <Text size="xs" c="dimmed" mt={2}>
                          {skill.description}
                        </Text>
                      )}
                      {skill.passCriteria && (
                        <Text size="xs" c="dimmed" mt={2}>
                          Pass: {skill.passCriteria}
                        </Text>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="xs"
                      variant={alreadyAdded ? 'default' : 'light'}
                      aria-label={`Add ${skill.name}`}
                      disabled={alreadyAdded || missingPassCriteria}
                      onClick={() => addBankSkill(skill)}
                    >
                      {alreadyAdded ? 'Added' : 'Add'}
                    </Button>
                  </Group>
                )
              })
            )}
          </Stack>
        </Stack>
      </Drawer>
    </>
  )
}

export function SkillPopover({
  existingNames,
  skillOptions = [],
  initial,
  submitLabel = 'Add',
  onSubmit,
  trigger,
}: SkillPopoverProps) {
  if (!initial && skillOptions.length > 0) {
    return (
      <SkillBankDrawer
        existingNames={existingNames}
        skillOptions={skillOptions}
        onSubmit={onSubmit}
        trigger={trigger}
      />
    )
  }

  return (
    <SkillFormDrawer
      existingNames={existingNames}
      skillOptions={skillOptions}
      initial={initial}
      submitLabel={submitLabel}
      onSubmit={onSubmit}
      trigger={trigger}
    />
  )
}

// Drawer form for editing a skill, plus fallback manual entry when no bank
// skills are available.
function SkillFormDrawer({
  existingNames,
  skillOptions = [],
  initial,
  submitLabel = 'Add',
  onSubmit,
  trigger,
}: SkillPopoverProps) {
  const familyOptions = skillFamilyOptions(skillOptions)
  const matchedFamilyKey =
    initial?.familyKey ??
    skillOptions.find(
      (skill) => normaliseSkillName(skill.name) === normaliseSkillName(initial?.name ?? '')
    )?.familyKey ??
    familyOptions[0]?.value ??
    ''
  const [opened, setOpened] = useState(false)
  const blank = () => ({
    familyKey: matchedFamilyKey,
    name: initial?.name ?? '',
    passCriteria: initial?.passCriteria ?? '',
    description: initial?.description ?? '',
  })
  const [entry, setEntry] = useState(blank)
  const [errors, setErrors] = useState<{
    name?: string
    familyKey?: string
    passCriteria?: string
  }>({})

  // Reset to the current initial each time the drawer opens.
  const openDrawer = () => {
    setEntry(blank())
    setErrors({})
    setOpened(true)
  }

  const submit = () => {
    const next: typeof errors = {}
    if (!entry.name.trim()) {
      next.name = 'This field is required'
    } else if (
      existingNames.some((name) => normaliseSkillName(name) === normaliseSkillName(entry.name))
    ) {
      next.name = 'A skill with this name already exists.'
    }
    if (familyOptions.length > 0 && !entry.familyKey) next.familyKey = 'Choose a skill family'
    if (!entry.passCriteria.trim()) next.passCriteria = 'This field is required'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSubmit({
      activities: [],
      ...initial,
      ...entry,
      familyName: familyOptions.find((family) => family.value === entry.familyKey)?.label,
    })
    setErrors({})
    setOpened(false)
  }

  return (
    <>
      {trigger(openDrawer)}
      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        position="right"
        size="sm"
        title={
          <Text fw={800} size="lg">
            {initial ? 'Edit skill' : 'Add skill'}
          </Text>
        }
        overlayProps={{ backgroundOpacity: 0.45 }}
      >
        <Stack gap="sm">
          <TextInput
            label="Skill name"
            labelProps={upperLabel}
            size="sm"
            placeholder="e.g. Back Float"
            value={entry.name}
            onChange={(event) => setEntry({ ...entry, name: event.currentTarget.value })}
            error={errors.name}
          />
          {familyOptions.length > 0 && (
            <Select
              label="Skill family"
              labelProps={upperLabel}
              size="sm"
              data={familyOptions}
              value={entry.familyKey}
              onChange={(value) => setEntry({ ...entry, familyKey: value ?? '' })}
              error={errors.familyKey}
              allowDeselect={false}
            />
          )}
          <TextInput
            label="Pass criteria"
            labelProps={upperLabel}
            size="sm"
            placeholder="e.g. 10 seconds unassisted"
            value={entry.passCriteria}
            onChange={(event) => setEntry({ ...entry, passCriteria: event.currentTarget.value })}
            error={errors.passCriteria}
          />
          <Textarea
            label="Skill description (optional)"
            labelProps={upperLabel}
            size="sm"
            autosize
            minRows={3}
            value={entry.description}
            onChange={(event) => setEntry({ ...entry, description: event.currentTarget.value })}
          />
          <Group justify="flex-end">
            <Button type="button" size="sm" onClick={submit}>
              {submitLabel}
            </Button>
          </Group>
        </Stack>
      </Drawer>
    </>
  )
}

function SkillBranch({
  skill,
  skillOptions,
  otherSkillNames,
  onUpdate,
  onRemove,
}: {
  skill: StageSkillDraft
  skillOptions: SkillBankOption[]
  otherSkillNames: string[]
  onUpdate: (skill: StageSkillDraft) => void
  onRemove: () => void
}) {
  return (
    <Card withBorder shadow="none" padding={0} radius="md">
      <Box
        p="sm"
        px="md"
        bg="gray.0"
        style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
      >
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Group gap="sm" wrap="wrap">
            <Text fw={800} size="sm">
              {skill.name}
            </Text>
            <Badge variant="light" size="sm">
              Pass: {skill.passCriteria}
            </Badge>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <SkillPopover
              existingNames={otherSkillNames}
              skillOptions={skillOptions}
              initial={skill}
              submitLabel="Save"
              onSubmit={onUpdate}
              trigger={(open) => (
                <Tooltip label="Edit skill">
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    aria-label={`Edit skill ${skill.name}`}
                    onClick={open}
                  >
                    <IconPencil size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
            />
            <Tooltip label="Remove from stage">
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                aria-label={`Remove ${skill.name} from stage`}
                onClick={onRemove}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
        {skill.description && (
          <Text size="xs" c="dimmed" mt={4}>
            {skill.description}
          </Text>
        )}
      </Box>
    </Card>
  )
}

export default function StageTree({
  stages,
  skillOptions = [],
  onEditStage,
  onRemoveStage,
  onAddSkill,
  onUpdateSkill,
  onRemoveSkill,
}: {
  stages: StageDraft[]
  skillOptions?: SkillBankOption[]
  onEditStage: (stageIndex: number) => void
  onRemoveStage: (stageIndex: number) => void
  onAddSkill: (stageIndex: number, skill: StageSkillDraft) => void
  onUpdateSkill: (stageIndex: number, skillIndex: number, skill: StageSkillDraft) => void
  onRemoveSkill: (stageIndex: number, skillIndex: number) => void
}) {
  const ordered = stages
    .map((stage, stageIndex) => ({ stage, stageIndex }))
    .sort((a, b) => Number(a.stage.position) - Number(b.stage.position))

  return (
    <Stack gap="sm">
      {ordered.map(({ stage, stageIndex }) => {
        return (
          <Card key={stageIndex} withBorder padding="md" shadow="none">
            <Stack gap="sm">
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon variant="light" radius="xl" size="md">
                    <Text size="xs" fw={700}>
                      {stage.position}
                    </Text>
                  </ThemeIcon>
                  <Text fw={700}>{stage.name}</Text>
                  {stage.code && (
                    <Text size="xs" c="dimmed">
                      {stage.code}
                    </Text>
                  )}
                  <Badge variant="light" color="blue" size="sm">
                    {countLabel(Number(stage.classesCount), 'class', 'classes')}
                  </Badge>
                  <Text size="sm" c="dimmed">
                    {stage.skills.length === 0
                      ? 'no skills yet'
                      : countLabel(stage.skills.length, 'skill', 'skills')}
                  </Text>
                </Group>
                <Group gap="xs" wrap="nowrap">
                  <Tooltip label="Edit stage">
                    <ActionIcon
                      variant="default"
                      aria-label="Edit stage"
                      onClick={() => onEditStage(stageIndex)}
                    >
                      <IconPencil size={14} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Remove stage">
                    <ActionIcon
                      variant="default"
                      color="red"
                      aria-label="Remove stage"
                      onClick={() => onRemoveStage(stageIndex)}
                    >
                      <IconTrash size={14} color="var(--mantine-color-red-7)" />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>

              {stage.skills.length === 0 ? (
                <Card bg="gray.0" padding="sm" shadow="none">
                  <Group justify="space-between" align="center">
                    <Text size="sm">Add skills from the skills bank for this stage.</Text>
                    <SkillPopover
                      existingNames={stage.skills.map((skill) => skill.name)}
                      skillOptions={skillOptions}
                      onSubmit={(skill) => onAddSkill(stageIndex, skill)}
                      trigger={(open) => (
                        <Button type="button" variant="default" size="xs" onClick={open}>
                          Add skill
                        </Button>
                      )}
                    />
                  </Group>
                </Card>
              ) : (
                <>
                  <Stack gap="md" pl={40}>
                    {stage.skills.map((skill, skillIndex) => (
                      <SkillBranch
                        key={skillIndex}
                        skill={skill}
                        skillOptions={skillOptions}
                        otherSkillNames={stage.skills
                          .filter((_, i) => i !== skillIndex)
                          .map((s) => s.name)}
                        onUpdate={(updated) => onUpdateSkill(stageIndex, skillIndex, updated)}
                        onRemove={() => onRemoveSkill(stageIndex, skillIndex)}
                      />
                    ))}
                  </Stack>
                  <div>
                    <SkillPopover
                      existingNames={stage.skills.map((skill) => skill.name)}
                      skillOptions={skillOptions}
                      onSubmit={(skill) => onAddSkill(stageIndex, skill)}
                      trigger={(open) => (
                        <Button
                          type="button"
                          variant="default"
                          size="xs"
                          leftSection={<IconPlus size={14} />}
                          onClick={open}
                        >
                          Add skill
                        </Button>
                      )}
                    />
                  </div>
                </>
              )}
            </Stack>
          </Card>
        )
      })}
    </Stack>
  )
}
