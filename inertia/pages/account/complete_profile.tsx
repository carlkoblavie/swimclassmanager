import { Form } from '@adonisjs/inertia/react'
import { Button, Container, Stack, Text, TextInput, Title } from '@mantine/core'
import { type Data } from '@generated/data'
import { type InertiaProps } from '~/types'

type PageProps = InertiaProps<{
  account: Data.Account
}>

export default function CompleteProfile({ account }: PageProps) {
  return (
    <Container size="xs" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Complete your profile</Title>
          <Text c="dimmed">Tell us a bit about you to finish setting up your account.</Text>
        </div>

        <Form route="accounts.update">
          {({ errors, processing }) => (
            <Stack gap="md">
              <TextInput
                label="Full name"
                name="fullName"
                defaultValue={account.fullName ?? ''}
                error={errors.fullName}
              />
              <TextInput
                label="Phone"
                type="tel"
                name="phone"
                defaultValue={account.phone ?? ''}
                error={errors.phone}
              />
              <TextInput
                label="Country"
                name="country"
                defaultValue={account.country ?? ''}
                error={errors.country}
              />
              <Button type="submit" loading={processing}>
                Complete profile
              </Button>
            </Stack>
          )}
        </Form>
      </Stack>
    </Container>
  )
}
