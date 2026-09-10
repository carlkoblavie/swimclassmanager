import { Box, Container, Group, List, Stack, Text, Title, UnstyledButton } from '@mantine/core'
import type { InertiaProps } from '~/types'

type GuideStep = {
  title: string
  description: string
  points?: string[]
}

type Guide = {
  slug: string
  title: string
  intro: string
  steps: GuideStep[]
}

type PageProps = InertiaProps<{ guides: Guide[] }>

/** Sticky right-hand nav linking to each guide section. */
function OnThisPage({ guides }: { guides: Guide[] }) {
  return (
    <Box
      component="aside"
      visibleFrom="md"
      style={{ width: 220, flexShrink: 0, position: 'sticky', top: 32, alignSelf: 'flex-start' }}
    >
      <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.14em" mb="xs">
        On this page
      </Text>
      <Stack gap={2}>
        {guides.map((guide) => (
          <UnstyledButton
            key={guide.slug}
            component="a"
            href={`#${guide.slug}`}
            px="sm"
            py={6}
            style={{ borderRadius: 8, borderLeft: '2px solid var(--mantine-color-gray-3)' }}
          >
            <Text size="sm" c="gray.7">
              {guide.title}
            </Text>
          </UnstyledButton>
        ))}
      </Stack>
    </Box>
  )
}

export default function Docs({ guides }: PageProps) {
  return (
    <Container size="lg" py={{ base: 32, sm: 56 }}>
      <Group align="flex-start" gap={48} wrap="nowrap">
        <Stack gap={48} style={{ flex: 1, minWidth: 0, maxWidth: 720 }}>
          {guides.map((guide) => (
            <Stack key={guide.slug} gap="lg">
              <Stack gap={6}>
                {/* Anchor sits on the title so links land exactly on it. */}
                <Title order={1} id={guide.slug} style={{ scrollMarginTop: 96 }}>
                  {guide.title}
                </Title>
                <Text c="dimmed">{guide.intro}</Text>
              </Stack>

              <Stack gap="lg">
                {guide.steps.map((step, index) => (
                  <Stack key={step.title} gap={4}>
                    <Text fw={700}>
                      {index + 1}. {step.title}
                    </Text>
                    <Text>{step.description}</Text>
                    {step.points && step.points.length > 0 && (
                      <List spacing={2} size="sm" c="dimmed">
                        {step.points.map((point) => (
                          <List.Item key={point}>{point}</List.Item>
                        ))}
                      </List>
                    )}
                  </Stack>
                ))}
              </Stack>
            </Stack>
          ))}
        </Stack>

        <OnThisPage guides={guides} />
      </Group>
    </Container>
  )
}
