import { Container, Stack, Text, Title } from '@mantine/core'
import type { InertiaProps } from '~/types'
import { Guard } from '~/utils/permissions'
import ShareSignupLink from '~/components/share_signup_link'

export default function Home({ activeOrganisation, activeSchool }: InertiaProps) {
  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        {activeSchool && (
          <div>
            {activeOrganisation && (
              <Text c="dimmed" fw={600} tt="uppercase" size="sm">
                {activeOrganisation.name}
              </Text>
            )}
            <Title order={1}>{activeSchool.name}</Title>
            <Text c="dimmed" size="lg">
              {activeSchool.location}
            </Text>
          </div>
        )}

        <Guard for="signup.view">
          {activeOrganisation && activeSchool && (
            <ShareSignupLink
              organisationSlug={activeOrganisation.slug}
              schoolSlug={activeSchool.slug}
            />
          )}
        </Guard>
      </Stack>
    </Container>
  )
}
