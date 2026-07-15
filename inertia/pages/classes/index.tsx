import { Button, Container, Group, Stack, Text, Title } from '@mantine/core'
import { Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import { Guard } from '~/utils/permissions'
import ClassCard from '~/components/class_card'
import ClassesEmptyState from '~/components/classes_empty_state'

type PageProps = InertiaProps<{
  classes: Data.SwimmingClass[]
}>

export default function ClassesIndex({ classes }: PageProps) {
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1}>Classes</Title>
            <Text c="dimmed" size="sm">
              Weekly classes, each on its own day with its own curriculum.
            </Text>
          </div>
          <Guard for="class.manage">
            <Button component={Link} route="programs.index" variant="light">
              Create classes from a program
            </Button>
          </Guard>
        </Group>

        {classes.length === 0 ? (
          <ClassesEmptyState />
        ) : (
          <Stack gap="md">
            {classes.map((swimmingClass) => (
              <ClassCard key={swimmingClass.id} swimmingClass={swimmingClass} />
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
