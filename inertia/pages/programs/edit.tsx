import { Container, Stack, Title } from '@mantine/core'
import { Form } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import ProgramFormBody from '~/components/program_form_body'
import type { LevelDraft } from '~/components/level_modal'

type PageProps = InertiaProps<{
  program: Data.Program.Variants['forEdit']
}>

export default function EditProgram({ program }: PageProps) {
  const initial = {
    name: program.name,
    description: program.description,
    levels: program.levels.map(
      (level): LevelDraft => ({
        id: level.id,
        name: level.name,
        ageGroup: level.ageGroup,
        description: level.description,
        defaultFee: String(level.defaultFee),
        capacity: String(level.capacity),
      })
    ),
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1}>Edit program</Title>
        <Form route="programs.update" routeParams={{ id: program.id }}>
          {({ errors, processing }) => (
            <ProgramFormBody
              errors={errors}
              processing={processing}
              submitLabel="Save changes"
              initial={initial}
            />
          )}
        </Form>
      </Stack>
    </Container>
  )
}
