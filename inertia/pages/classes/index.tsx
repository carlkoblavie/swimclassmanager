import { Button, Container, Group, Stack, Title } from '@mantine/core'
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
        <Group justify="space-between">
          <Title order={1}>Classes</Title>
          <Guard for="class.manage">
            <Button component={Link} route="swimming_classes.create" variant="light">
              Create class
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
