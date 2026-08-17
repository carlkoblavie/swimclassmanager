import { Badge, Card, Container, Divider, Group, Stack, Text, Title } from '@mantine/core'
import type { InertiaProps } from '~/types'

type ReleaseEntry = {
  kind: 'NEW' | 'IMPROVED'
  title: string
  description: string
}

type ReleaseData = {
  version: string
  releasedOn: string
  intro: string
  entries: ReleaseEntry[]
}

type PageProps = InertiaProps<{ release: ReleaseData }>

export default function Release({ release }: PageProps) {
  return (
    <Container size="md" py={{ base: 32, sm: 56 }}>
      <Stack gap={6} mb={{ base: 40, sm: 56 }}>
        <Title order={1} size="h1" mt="xs">
          What&apos;s new
        </Title>
        <Text size="lg" c="dimmed">
          Everything shipped to your school, newest first.
        </Text>
      </Stack>

      <Stack gap="lg">
        <Stack gap="xs">
          <Group justify="space-between" align="center" gap="md" wrap="wrap">
            <Group gap="sm">
              <Title order={2} size="h2">
                {release.version}
              </Title>
              <Badge color="blue" variant="light" size="lg">
                LATEST
              </Badge>
            </Group>
            <Text size="md" c="dimmed">
              {release.releasedOn}
            </Text>
          </Group>
          <Text size="lg" c="dimmed">
            {release.intro}
          </Text>
        </Stack>

        <Card withBorder radius="lg" padding={0} shadow="none" style={{ overflow: 'hidden' }}>
          {release.entries.map((entry, index) => (
            <Stack key={entry.title} gap={4} p={{ base: 'lg', sm: 'xl' }}>
              <Group align="flex-start" gap="lg" wrap="nowrap">
                <Text
                  size="sm"
                  fw={800}
                  c="blue"
                  style={{ letterSpacing: 1.1, minWidth: 116, flexShrink: 0 }}
                >
                  {entry.kind}
                </Text>
                <Stack gap={2}>
                  <Title order={3} size="h3">
                    {entry.title}
                  </Title>
                  <Text size="lg" c="dimmed">
                    {entry.description}
                  </Text>
                </Stack>
              </Group>
              {index < release.entries.length - 1 && <Divider mt="lg" />}
            </Stack>
          ))}
        </Card>
      </Stack>
    </Container>
  )
}
