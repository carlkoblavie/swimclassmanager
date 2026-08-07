import { useMemo, useState } from 'react'
import { Badge, Box, Button, Drawer, Group, Stack, Text, TextInput } from '@mantine/core'
import { IconPlus, IconSearch, IconX } from '@tabler/icons-react'

export type ClassSkillOption = {
  id: number
  familyKey: string
  familyName: string
  name: string
  description: string | null
  passCriteria: string | null
  sourceKey?: string | null
}

function normaliseSkillName(name: string) {
  return name.trim().toLowerCase()
}

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

export default function ClassSkillPicker({
  skillOptions,
  value,
  onChange,
}: {
  skillOptions: ClassSkillOption[]
  value: string[]
  onChange: (value: string[]) => void
}) {
  const [opened, setOpened] = useState(false)
  const [search, setSearch] = useState('')
  const [activeFamily, setActiveFamily] = useState<string | null>(null)
  const selectedIdSet = useMemo(() => new Set(value), [value])
  const selectedSkills = value.flatMap((id) => {
    const skill = skillOptions.find((candidate) => String(candidate.id) === id)
    return skill ? [skill] : []
  })
  const familyOptions = useMemo(() => {
    const byKey = new Map<string, string>()
    for (const skill of skillOptions) {
      byKey.set(skill.familyKey, skill.familyName)
    }

    return [...byKey.entries()]
      .map(([familyKey, familyName]) => ({ familyKey, familyName }))
      .sort((a, b) => a.familyName.localeCompare(b.familyName))
  }, [skillOptions])
  const normalizedSearch = normaliseSkillName(search)
  const filteredSkills = skillOptions.filter((skill) => {
    const matchesFamily = !activeFamily || skill.familyKey === activeFamily
    const searchableText = [skill.name, skill.familyName, skill.description, skill.passCriteria]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    const matchesSearch = normalizedSearch.length === 0 || searchableText.includes(normalizedSearch)

    return matchesFamily && matchesSearch
  })

  const addSkill = (skillId: number) => {
    const id = String(skillId)
    if (selectedIdSet.has(id)) {
      return
    }

    onChange([...value, id])
  }

  const removeSkill = (skillId: number) => {
    onChange(value.filter((id) => id !== String(skillId)))
  }

  const openDrawer = () => {
    setSearch('')
    setActiveFamily(null)
    setOpened(true)
  }

  return (
    <>
      <Group gap="xs" mt="xs">
        {selectedSkills.map((skill) => (
          <Badge
            key={skill.id}
            variant="light"
            size="lg"
            rightSection={
              <IconX
                size={12}
                style={{ cursor: 'pointer' }}
                onClick={() => removeSkill(skill.id)}
              />
            }
          >
            {skill.name}
          </Badge>
        ))}
        {skillOptions.length > 0 && (
          <Button
            variant="default"
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={openDrawer}
          >
            Add skill
          </Button>
        )}
        {skillOptions.length === 0 && (
          <Text size="sm" c="dimmed">
            No skills are available in the skill bank yet.
          </Text>
        )}
      </Group>

      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
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
                key={family.familyKey}
                type="button"
                size="xs"
                variant={activeFamily === family.familyKey ? 'filled' : 'default'}
                color={activeFamily === family.familyKey ? 'dark' : 'gray'}
                onClick={() => setActiveFamily(family.familyKey)}
              >
                {family.familyName}
              </Button>
            ))}
          </Group>

          <Group justify="space-between">
            <Text size="xs" fw={800} tt="uppercase" c="dimmed" lts="0.05em">
              {filteredSkills.length} of {skillOptions.length} skills
            </Text>
            <Text size="xs" c="dimmed">
              {countLabel(selectedSkills.length, 'skill', 'skills')} selected
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
                const alreadySelected = selectedIdSet.has(String(skill.id))

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
                      background: alreadySelected ? 'var(--mantine-color-blue-0)' : undefined,
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
                      variant={alreadySelected ? 'default' : 'light'}
                      aria-label={`${alreadySelected ? 'Remove' : 'Add'} ${skill.name}`}
                      onClick={() => {
                        if (alreadySelected) {
                          removeSkill(skill.id)
                        } else {
                          addSkill(skill.id)
                        }
                      }}
                    >
                      {alreadySelected ? 'Remove' : 'Add'}
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
