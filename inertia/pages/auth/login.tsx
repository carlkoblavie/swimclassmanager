import { Form } from '@adonisjs/inertia/react'
import { Button, Container, Stack, Text, TextInput, Title } from '@mantine/core'

export default function Login() {
  return (
    <Container size="xs" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Sign in</Title>
          <Text c="dimmed">Enter your email and we&apos;ll send you a sign-in link.</Text>
        </div>

        <Form route="sign_in_links.store">
          {({ errors, processing }) => (
            <Stack gap="md">
              <TextInput
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                error={errors.email}
              />
              <Button type="submit" loading={processing}>
                Send sign-in link
              </Button>
            </Stack>
          )}
        </Form>
      </Stack>
    </Container>
  )
}
