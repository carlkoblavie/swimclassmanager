import { type ReactElement } from 'react'
import { Form, Link } from '@adonisjs/inertia/react'
import {
  Anchor,
  Button,
  Checkbox,
  Divider,
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
  IconUser,
} from '@tabler/icons-react'
import { type Data } from '@generated/data'
import AuthLayout from '~/layouts/auth'

function Signup() {
  return (
    <Stack gap={26}>
      <Stack gap={8}>
        <Title order={1} className="auth-page-title">
          Create your account
        </Title>
        <Text c="dimmed" fz="md">
          Set up your institution workspace and first swim school.
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
              label="I agree to create this institution workspace for my swim school."
              error={errors.terms}
            />

            <Button
              type="submit"
              size="md"
              loading={processing}
              rightSection={<IconArrowRight size={18} stroke={1.8} />}
            >
              Register institution
            </Button>
          </Stack>
        )}
      </Form>

      <Divider label="Already have an account?" labelPosition="center" />

      <Button component={Link} route="sign_in_links.create" variant="default" size="md">
        Sign in to existing account
      </Button>

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
