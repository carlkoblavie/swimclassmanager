import { Link } from '@adonisjs/inertia/react'
import { Button, Container, Group, Stack, Text, Title } from '@mantine/core'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import SignupCard from '~/components/signup_card'

type PageProps = InertiaProps<{
  signups: Data.Signup[]
}>

export default function SignupsIndex({ signups }: PageProps) {
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>Sign-ups</Title>
          <Button component={Link} route="home" variant="subtle">
            Back to dashboard
          </Button>
        </Group>

        {signups.length === 0 ? (
          <Text c="dimmed">No sign-ups yet.</Text>
        ) : (
          <Stack gap="md">
            {signups.map((signup) => (
              <SignupCard key={signup.id} signup={signup} />
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
