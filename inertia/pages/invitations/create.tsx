import { Form } from '@adonisjs/inertia/react'
import {
  Anchor,
  Button,
  Card,
  Code,
  CopyButton,
  Container,
  Group,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import type { InertiaProps } from '~/types'

type PageProps = InertiaProps<{
  roles: Array<{ value: string; label: string; disabled?: boolean }>
  invitation?: { name: string; email: string; link: string }
}>

export default function CreateInvitation({ roles, invitation }: PageProps) {
  return (
    <Container size="xs" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Invite a member</Title>
          <Text c="dimmed">Send an invitation by email and choose their role.</Text>
        </div>

        {invitation && (
          <Card withBorder radius="md" padding="md">
            <Stack gap="xs">
              <Text fw={600}>Invitation created</Text>
              <Text size="sm" c="dimmed">
                Email delivery is disabled for now. Share this link with {invitation.name} instead.
              </Text>
              <Group wrap="nowrap" align="center">
                <Anchor
                  href={invitation.link}
                  target="_blank"
                  rel="noreferrer"
                  size="sm"
                  style={{ minWidth: 0, flex: 1, overflowWrap: 'anywhere' }}
                >
                  <Code>{invitation.link}</Code>
                </Anchor>
                <CopyButton value={invitation.link} timeout={1500}>
                  {({ copied, copy }) => (
                    <Button size="xs" variant="light" onClick={copy}>
                      {copied ? 'Copied' : 'Copy link'}
                    </Button>
                  )}
                </CopyButton>
              </Group>
            </Stack>
          </Card>
        )}

        <Form route="invitations.store">
          {({ errors, processing }) => (
            <Stack gap="md">
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  label="First name"
                  name="firstName"
                  autoComplete="given-name"
                  required
                  error={errors.firstName}
                />
                <TextInput
                  label="Last name"
                  name="lastName"
                  autoComplete="family-name"
                  required
                  error={errors.lastName}
                />
              </SimpleGrid>
              <TextInput
                label="Phone number"
                type="tel"
                name="phone"
                autoComplete="tel"
                required
                error={errors.phone}
              />
              <TextInput
                label="Email"
                name="email"
                autoComplete="email"
                required
                error={errors.email}
              />
              <NativeSelect label="Role" name="role" data={roles} error={errors.role} />
              <Button type="submit" loading={processing}>
                Send invitation
              </Button>
            </Stack>
          )}
        </Form>
      </Stack>
    </Container>
  )
}
