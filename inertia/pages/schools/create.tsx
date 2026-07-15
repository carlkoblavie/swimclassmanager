import { useState } from 'react'
import { type Data } from '@generated/data'
import { Form } from '@adonisjs/inertia/react'
import {
  Button,
  Container,
  NativeSelect,
  Radio,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import type { InertiaProps } from '~/types'

type PageProps = InertiaProps<{
  organisations: Data.Organisation[]
  firstSchool: boolean
}>

export default function CreateSchool({ organisations, firstSchool }: PageProps) {
  const canUseExistingOrganisation = organisations.length > 0
  const [mode, setMode] = useState(canUseExistingOrganisation ? 'existing' : 'new')

  return (
    <Container size="xs" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Create a school</Title>
          <Text c="dimmed">
            {firstSchool
              ? 'Set up your organisation and first school to get started.'
              : 'Add a school to an organisation you manage, or start a new organisation.'}
          </Text>
        </div>

        <Form route="schools.store">
          {({ errors, processing }) => (
            <Stack gap="md">
              {canUseExistingOrganisation && (
                <Radio.Group value={mode} onChange={setMode} label="Organisation">
                  <Stack gap="xs" mt="xs">
                    <Radio value="existing" label="Use an existing organisation" />
                    <Radio value="new" label="Create a new organisation" />
                  </Stack>
                </Radio.Group>
              )}

              {mode === 'existing' && canUseExistingOrganisation ? (
                <NativeSelect
                  label="Organisation"
                  name="organisationId"
                  data={organisations.map((organisation) => ({
                    value: String(organisation.id),
                    label: organisation.name,
                  }))}
                  error={errors.organisationId}
                />
              ) : (
                <TextInput
                  label="Organisation name"
                  name="organisationName"
                  error={errors.organisationName}
                />
              )}

              <TextInput label="School name" name="schoolName" error={errors.schoolName} />
              <TextInput label="Location" name="location" error={errors.location} />
              <Button type="submit" loading={processing}>
                Create school
              </Button>
            </Stack>
          )}
        </Form>
      </Stack>
    </Container>
  )
}
