import { Badge, Box, Group, Stack, Text } from '@mantine/core'
import type { Data } from '@generated/data'

type StageSkill = Data.SwimmingClass['skills'][number]

export default function LessonStageSkills({ skills }: { skills: StageSkill[] }) {
  if (skills.length === 0) {
    return null
  }

  return (
    <Box
      p="sm"
      style={{
        border: '1px solid var(--mantine-color-gray-3)',
        borderRadius: 8,
        background: 'white',
      }}
    >
      <Group justify="space-between" align="center" mb="xs">
        <Text size="xs" fw={800} tt="uppercase" c="dimmed" lts="0.05em">
          Stage skills
        </Text>
        <Badge variant="light" color="gray" size="sm">
          {skills.length} {skills.length === 1 ? 'skill' : 'skills'}
        </Badge>
      </Group>

      <Stack gap={6}>
        {skills.map((skill) => (
          <Group key={skill.id} justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
            <div style={{ minWidth: 0, flex: 1 }}>
              <Text size="sm" fw={800} truncate>
                {skill.name}
              </Text>
              <Text size="xs" c="dimmed">
                Pass: {skill.passCriteria}
              </Text>
            </div>
            {skill.activities.length > 0 && (
              <Badge variant="light" color="aqua" size="sm" style={{ flexShrink: 0 }}>
                {skill.activities.length}{' '}
                {skill.activities.length === 1 ? 'activity' : 'activities'}
              </Badge>
            )}
          </Group>
        ))}
      </Stack>
    </Box>
  )
}
