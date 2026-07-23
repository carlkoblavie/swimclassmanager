import { ReactElement } from 'react'
import { Form } from '@adonisjs/inertia/react'
import { Button, PasswordInput, Stack, Text, Title } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import { type Data } from '@generated/data'
import AuthLayout from '~/layouts/auth'

function ChangePassword() {
  return (
    <Stack gap={28}>
      <Stack gap={8}>
        <Title order={1} className="auth-page-title">
          Change your password
        </Title>
        <Text c="dimmed" fz="md">
          Set a new password before continuing to your dashboard.
        </Text>
      </Stack>

      <Form route="account_passwords.update">
        {({ errors, processing }) => (
          <Stack gap="lg">
            <PasswordInput
              label="New password"
              name="password"
              autoComplete="new-password"
              error={errors.password}
            />
            <PasswordInput
              label="Confirm password"
              name="passwordConfirmation"
              autoComplete="new-password"
              error={errors.passwordConfirmation}
            />
            <Button
              type="submit"
              size="md"
              loading={processing}
              rightSection={<IconArrowRight size={18} stroke={1.8} />}
            >
              Update password
            </Button>
          </Stack>
        )}
      </Form>
    </Stack>
  )
}

;(ChangePassword as { layout?: (page: ReactElement<Data.SharedProps>) => ReactElement }).layout = (
  page
) => <AuthLayout>{page}</AuthLayout>

export default ChangePassword
