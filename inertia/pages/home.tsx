import { Container, Stack, Text, Title } from '@mantine/core'
import type { InertiaProps } from '~/types'
import { Guard } from '~/utils/permissions'
import ShareSignupLink from '~/components/share_signup_link'

export default function Home({ activeClub }: InertiaProps) {
  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        {activeClub && (
          <div>
            <Title order={1}>{activeClub.name}</Title>
            <Text c="dimmed" size="lg">
              {activeClub.location}
            </Text>
          </div>
        )}

        <Guard for="signup.view">{activeClub && <ShareSignupLink slug={activeClub.slug} />}</Guard>
      </Stack>
    </Container>
  )
}
