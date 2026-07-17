import { ReactElement } from 'react'
import { Form, Link } from '@adonisjs/inertia/react'
import { Anchor, Button, Divider, Group, Stack, Text, TextInput, Title } from '@mantine/core'
import { IconArrowRight, IconMail } from '@tabler/icons-react'
import { type Data } from '@generated/data'
import AuthLayout from '~/layouts/auth'

function Login() {
  return (
    <Stack gap={30}>
      <Stack gap={8}>
        <Title order={1} className="auth-page-title">
          Sign in
        </Title>
        <Text c="dimmed" fz="md">
          Enter your email and we&apos;ll send you a secure sign-in link.
        </Text>
      </Stack>

      <Form route="sign_in_links.store">
        {({ errors, processing }) => (
          <Stack gap="lg">
            <TextInput
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@example.com"
              leftSection={<IconMail size={18} stroke={1.7} />}
              error={errors.email}
            />

            <Button
              type="submit"
              size="md"
              loading={processing}
              rightSection={<IconArrowRight size={18} stroke={1.8} />}
            >
              Send sign-in link
            </Button>
          </Stack>
        )}
      </Form>

      <Divider label="Passwordless access" labelPosition="center" />

      <Text ta="center" c="dimmed" fz="sm">
        Don&apos;t have an account?{' '}
        <Anchor component={Link} route="account_registrations.create" fw={700}>
          Register institution
        </Anchor>
      </Text>

      <Group justify="center" gap="xl" className="auth-footer-links">
        <Anchor size="xs" c="dimmed">
          Privacy Policy
        </Anchor>
        <Anchor size="xs" c="dimmed">
          Terms of Service
        </Anchor>
        <Anchor size="xs" c="dimmed">
          Security Overview
        </Anchor>
      </Group>
    </Stack>
  )
}

;(Login as { layout?: (page: ReactElement<Data.SharedProps>) => ReactElement }).layout = (page) => (
  <AuthLayout>{page}</AuthLayout>
)

export default Login
