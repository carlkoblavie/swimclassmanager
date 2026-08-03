import { type ReactElement } from 'react'
import { Form } from '@adonisjs/inertia/react'
import {
  Anchor,
  Button,
  Checkbox,
  Group,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import {
  IconArrowRight,
  IconBuildingCommunity,
  IconMail,
  IconMapPin,
  IconPhone,
  IconUser,
} from '@tabler/icons-react'
import { type Data } from '@generated/data'
import AuthLayout from '~/layouts/auth'

function Signup() {
  return (
    <Stack gap={26}>
      <Stack gap={8}>
        <Title order={1} className="auth-page-title">
          Join our waitlist
        </Title>
        <Text c="dimmed" fz="md">
          Be the first to be notified when we launch.
        </Text>
      </Stack>

      <Form route="account_registrations.store">
        {({ errors, processing }) => (
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                label="First name"
                name="firstName"
                placeholder="Jane"
                autoComplete="given-name"
                leftSection={<IconUser size={18} stroke={1.7} />}
                error={errors.firstName}
              />
              <TextInput
                label="Last name"
                name="lastName"
                placeholder="Doe"
                autoComplete="family-name"
                error={errors.lastName}
              />
            </SimpleGrid>

            <NativeSelect
              label="Account type"
              name="accountType"
              data={[
                { value: 'educational_institution', label: 'Educational institution' },
                { value: 'swim_school', label: 'Swim school' },
                { value: 'hospitality_institution', label: 'Hospitality institution' },
              ]}
              leftSection={<IconBuildingCommunity size={18} stroke={1.7} />}
              error={errors.accountType}
            />

            <TextInput
              label="Institutional email"
              type="email"
              name="email"
              placeholder="name@institution.com"
              autoComplete="email"
              leftSection={<IconMail size={18} stroke={1.7} />}
              error={errors.email}
            />

            <TextInput
              label="Phone number"
              type="tel"
              name="phone"
              placeholder="0240000998"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={10}
              pattern="[0-9]{10}"
              required
              withAsterisk
              leftSection={<IconPhone size={18} stroke={1.7} />}
              error={errors.phone}
            />

            <TextInput
              label="Institution name"
              name="organisationName"
              placeholder="Aqua Swim Organisation"
              leftSection={<IconBuildingCommunity size={18} stroke={1.7} />}
              error={errors.organisationName}
            />

            <TextInput
              label="Location"
              name="location"
              placeholder="Accra"
              leftSection={<IconMapPin size={18} stroke={1.7} />}
              error={errors.location}
            />

            <Checkbox
              name="terms"
              value="yes"
              label="Notify me when we launch"
              error={errors.terms}
            />

            <Button
              type="submit"
              size="md"
              loading={processing}
              rightSection={<IconArrowRight size={18} stroke={1.8} />}
            >
              Join the waitlist
            </Button>
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
          Help Center
        </Anchor>
      </Group>
    </Stack>
  )
}

;(Signup as { layout?: (page: ReactElement<Data.SharedProps>) => ReactElement }).layout = (
  page
) => <AuthLayout>{page}</AuthLayout>

export default Signup
