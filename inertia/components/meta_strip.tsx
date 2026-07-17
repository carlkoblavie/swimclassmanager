import type { ReactNode } from 'react'
import { Box, SimpleGrid, Text } from '@mantine/core'

export type MetaItem = { label: string; value: ReactNode }

// The mockups' stat strip: hairline-divided cells under a detail hero.
export default function MetaStrip({ items }: { items: MetaItem[] }) {
  return (
    <SimpleGrid cols={{ base: 2, sm: Math.min(items.length, 4) }} spacing={1} bg="gray.2">
      {items.map((item) => (
        <Box key={item.label} bg="white" px="lg" py="md">
          <Text size="xs" tt="uppercase" c="dimmed" fw={600} lts="0.05em" mb={4}>
            {item.label}
          </Text>
          <Text fw={700} component="div">
            {item.value}
          </Text>
        </Box>
      ))}
    </SimpleGrid>
  )
}
