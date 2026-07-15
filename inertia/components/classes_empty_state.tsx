import { Button, Card, Stack, Text } from '@mantine/core'
import { Link } from '@adonisjs/inertia/react'
import { Guard } from '~/utils/permissions'

export default function ClassesEmptyState() {
  return (
    <Card withBorder radius="md" padding="lg">
      <Stack gap="sm" align="flex-start">
        <Text fw={600}>No classes yet.</Text>
        <Text c="dimmed" size="sm">
          Create a recurring class under an available program level to publish its schedule.
        </Text>
        <Guard for="class.manage">
          <Button component={Link} route="swimming_classes.create" variant="light">
            Create class
          </Button>
        </Guard>
      </Stack>
    </Card>
  )
}
