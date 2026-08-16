import { Box, Group, SimpleGrid, Text } from '@mantine/core'
import type { Data } from '@generated/data'

type StageSkill = Data.SwimmingClass['skills'][number]

export default function LessonSkillTiles({ skills }: { skills: StageSkill[] }) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
      {skills.map((skill, index) => (
        <Box
          key={skill.id}
          p="md"
          style={{
            border: '1px solid var(--mantine-color-gray-2)',
            borderRadius: 8,
          }}
        >
          <Group gap="sm" align="flex-start" wrap="nowrap">
            <Box
              w={40}
              h={40}
              bg="gray.1"
              c="gray.6"
              style={{
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Text fw={800} size="md">
                {index + 1}
              </Text>
            </Box>
            <Box style={{ minWidth: 0 }}>
              <Text fw={800} size="md" lh={1.25}>
                {skill.name}
              </Text>
              <Text c="gray.5" mt={4}>
                <Text component="span" c="teal.6" fw={800}>
                  Pass
                </Text>{' '}
                · {skill.passCriteria ?? 'Criteria not set'}
              </Text>
            </Box>
          </Group>
        </Box>
      ))}
    </SimpleGrid>
  )
}
