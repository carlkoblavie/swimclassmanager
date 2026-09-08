import { Container, List, Stack, Text, Title } from '@mantine/core'
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

export default function Docs({ guides }: PageProps) {
  return (
    <Container size="sm" py={{ base: 32, sm: 56 }}>
      <Stack gap={48}>
        {guides.map((guide) => (
          <Stack key={guide.slug} gap="lg">
            <Stack gap={6}>
              <Title order={1}>{guide.title}</Title>
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
    </Container>
  )
}
