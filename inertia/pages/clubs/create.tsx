import { Form } from '@adonisjs/inertia/react'
import { Button, Container, Stack, Text, TextInput, Title } from '@mantine/core'

export default function CreateClub() {
  return (
    <Container size="xs" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Create a club</Title>
          <Text c="dimmed">Set up a club to get started.</Text>
        </div>

        <Form route="clubs.store">
          {({ errors, processing }) => (
            <Stack gap="md">
              <TextInput label="Name" name="name" error={errors.name} />
              <TextInput label="Location" name="location" error={errors.location} />
              <Button type="submit" loading={processing}>
                Create club
              </Button>
            </Stack>
          )}
        </Form>
      </Stack>
    </Container>
  )
}
