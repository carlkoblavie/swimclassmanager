import { Form } from '@adonisjs/inertia/react'
import { Button, Container, NativeSelect, Stack, Text, TextInput, Title } from '@mantine/core'
import type { InertiaProps } from '~/types'

type PageProps = InertiaProps<{
  roles: string[]
}>

export default function CreateInvitation({ roles }: PageProps) {
  return (
    <Container size="xs" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Invite a member</Title>
          <Text c="dimmed">Send an invitation by email and choose their role.</Text>
        </div>

        <Form route="invitations.store">
          {({ errors, processing }) => (
            <Stack gap="md">
              <TextInput label="Email" name="email" error={errors.email} />
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
