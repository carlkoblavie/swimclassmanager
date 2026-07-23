import { ReactElement, useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import { Anchor, Button, Checkbox, Divider, Group, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { IconArrowRight, IconMail, IconSparkles } from '@tabler/icons-react'
import { type Data } from '@generated/data'
import AuthLayout from '~/layouts/auth'

function Login() {
  const [email, setEmail] = useState('')

  return (
    <Stack gap={30}>
      <Stack gap={8}>
        <Title order={1} className="auth-page-title">
          Sign in
        </Title>
        <Text c="dimmed" fz="md">
          Enter your email and password to access your swim school dashboard.
        </Text>
      </Stack>

      <Form route="sessions.store">
        {({ errors, processing }) => (
          <Stack gap="lg">
            <TextInput
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              autoComplete="email"
              placeholder="name@example.com"
              leftSection={<IconMail size={18} stroke={1.7} />}
              error={errors.email}
            />

            <PasswordInput
              label="Password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              error={errors.password}
            />

            <Checkbox name="remember" label="Keep me signed in" />

            <Button
              type="submit"
              size="md"
              loading={processing}
              rightSection={<IconArrowRight size={18} stroke={1.8} />}
            >
              Sign in
            </Button>
          </Stack>
        )}
      </Form>

      <Divider label="Passwordless access" labelPosition="center" />

      <Form route="sign_in_links.store">
        {({ errors, processing }) => (
          <Stack gap="sm">
            <input type="hidden" name="email" value={email} />
            <Button
              type="submit"
              variant="default"
              size="md"
              loading={processing}
              leftSection={<IconSparkles size={18} stroke={1.7} />}
            >
              Send sign-in link
            </Button>
            {errors.email && (
              <Text c="red" size="sm">
                {errors.email}
              </Text>
            )}
          </Stack>
        )}
      </Form>

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
