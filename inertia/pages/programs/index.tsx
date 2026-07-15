import { Button, Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { IconCircleCheck, IconListDetails, IconStack2 } from '@tabler/icons-react'
import { Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import { Guard } from '~/utils/permissions'
import ProgramTable from '~/components/program_table'
import StatCard from '~/components/stat_card'

type PageProps = InertiaProps<{
  programs: Data.Program[]
}>

export default function ProgramsIndex({ programs }: PageProps) {
  const levels = programs.flatMap((program) => program.levels ?? [])
  const availableLevels = levels.filter((level) => level.available)

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1}>Swim Programs</Title>
            <Text c="dimmed" size="sm">
              The shared curriculum catalog: programs, levels, and your school's fees and
              availability.
            </Text>
          </div>
          <Guard for="program.manage">
            <Button component={Link} route="programs.create">
              Create program
            </Button>
          </Guard>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <StatCard
            label="Total programs"
            value={programs.length}
            icon={<IconStack2 size={20} stroke={1.6} />}
          />
          <StatCard
            label="Total levels"
            value={levels.length}
            icon={<IconListDetails size={20} stroke={1.6} />}
          />
          <StatCard
            label="Available to your school"
            value={availableLevels.length}
            icon={<IconCircleCheck size={20} stroke={1.6} />}
          />
        </SimpleGrid>

        {programs.length === 0 ? (
          <Text c="dimmed">No programs yet.</Text>
        ) : (
          <ProgramTable programs={programs} />
        )}
      </Stack>
    </Container>
  )
}
