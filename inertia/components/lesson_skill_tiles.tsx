import { Group, Text } from '@mantine/core'
import type { Data } from '@generated/data'

type StageSkill = Data.SwimmingClass['skills'][number]

export default function LessonSkillTiles({ skills }: { skills: StageSkill[] }) {
  return (
    <Group gap="lg" align="baseline" wrap="wrap">
      {skills.map((skill, index) => (
        <Group key={skill.id} gap={6} wrap="nowrap" align="baseline">
          <Text c="gray.5" fw={800} size="sm">
            {index + 1}
          </Text>
          <Text fw={700} size="md">
            {skill.name}
          </Text>
        </Group>
      ))}
    </Group>
  )
}
