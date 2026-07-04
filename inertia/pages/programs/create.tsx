import { Container, Stack, Title } from '@mantine/core'
import { Form } from '@adonisjs/inertia/react'
import ProgramFormBody from '~/components/program_form_body'

export default function CreateProgram() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1}>Create a program</Title>
        <Form route="programs.store">
          {({ errors, processing }) => (
            <ProgramFormBody errors={errors} processing={processing} submitLabel="Create program" />
          )}
        </Form>
      </Stack>
    </Container>
  )
}
