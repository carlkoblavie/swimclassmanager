import { Button, Card, Stack, Text } from '@mantine/core'
import { Link } from '@adonisjs/inertia/react'
import { Guard } from '~/utils/permissions'

export default function ClassesEmptyState() {
  return (
    <Card withBorder radius="md" padding="lg">
      <Stack gap="sm" align="flex-start">
        <Text fw={600}>No classes yet.</Text>
        <Text c="dimmed" size="sm">
          Create classes from an available program level; each day is its own class.
        </Text>
        <Guard for="class.manage">
          <Button component={Link} route="programs.index" variant="light">
            Go to programs
          </Button>
        </Guard>
      </Stack>
    </Card>
  )
}
