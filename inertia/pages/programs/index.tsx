import { Button, Container, Group, Stack, Text, Title } from '@mantine/core'
import { Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import { Guard } from '~/utils/permissions'
import ProgramCard from '~/components/program_card'

type PageProps = InertiaProps<{
  programs: Data.Program[]
}>

export default function ProgramsIndex({ programs }: PageProps) {
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>Programs</Title>
          <Guard for="program.manage">
            <Button component={Link} route="programs.create" variant="light">
              Create program
            </Button>
          </Guard>
        </Group>

        {programs.length === 0 ? (
          <Text c="dimmed">No programs yet.</Text>
        ) : (
          <Stack gap="md">
            {programs.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
