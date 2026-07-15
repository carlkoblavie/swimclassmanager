import { Button, Checkbox, Group, Stack, Text, Textarea, TextInput } from '@mantine/core'
import type { Data } from '@generated/data'

export type NewSkillDraft = {
  name: string
  description: string
}

type Props = {
  skillOptions: Data.Skill[]
  selectedSkillIds: number[]
  newSkills: NewSkillDraft[]
  onToggleSkill: (skillId: number) => void
  onAddNewSkill: () => void
  onUpdateNewSkill: (index: number, field: keyof NewSkillDraft, value: string) => void
  onRemoveNewSkill: (index: number) => void
}

export default function SkillPicker({
  skillOptions,
  selectedSkillIds,
  newSkills,
  onToggleSkill,
  onAddNewSkill,
  onUpdateNewSkill,
  onRemoveNewSkill,
}: Props) {
  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Text fw={500}>Available skills</Text>
        {skillOptions.length === 0 ? (
          <Text size="sm" c="dimmed">
            No skills yet. Add a school-specific skill below.
          </Text>
        ) : (
          skillOptions.map((skill) => (
            <Checkbox
              key={skill.id}
              label={`${skill.name} (${skill.scope === 'platform' ? 'Platform default' : 'School skill'})`}
              checked={selectedSkillIds.includes(skill.id)}
              onChange={() => onToggleSkill(skill.id)}
            />
          ))
        )}
      </Stack>

      <Stack gap="xs">
        <Group justify="space-between">
          <Text fw={500}>New school-specific skills</Text>
          <Button type="button" variant="light" size="xs" onClick={onAddNewSkill}>
            Add skill
          </Button>
        </Group>

        {newSkills.length === 0 ? (
          <Text size="sm" c="dimmed">
            Add a skill here if it is not already listed.
          </Text>
        ) : (
          newSkills.map((skill, index) => (
            <Stack key={index} gap="xs">
              <TextInput
                label="Skill name"
                value={skill.name}
                onChange={(event) => onUpdateNewSkill(index, 'name', event.currentTarget.value)}
              />
              <Textarea
                label="Skill description"
                value={skill.description}
                onChange={(event) =>
                  onUpdateNewSkill(index, 'description', event.currentTarget.value)
                }
                autosize
                minRows={2}
              />
              <Group justify="flex-end">
                <Button
                  type="button"
                  variant="subtle"
                  color="red"
                  size="xs"
                  onClick={() => onRemoveNewSkill(index)}
                >
                  Remove skill
                </Button>
              </Group>
            </Stack>
          ))
        )}
      </Stack>
    </Stack>
  )
}
