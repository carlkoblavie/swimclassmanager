import type { ReactNode } from 'react'
import { Card, Group, Text, ThemeIcon } from '@mantine/core'

export default function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: ReactNode
}) {
  return (
    <Card>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div>
          <Text size="xs" tt="uppercase" c="dimmed" fw={700}>
            {label}
          </Text>
          <Text fz={28} fw={700} lh={1.3}>
            {value}
          </Text>
        </div>
        <ThemeIcon variant="light" size="lg" radius="md">
          {icon}
        </ThemeIcon>
      </Group>
    </Card>
  )
}
