import { router } from '@inertiajs/react'
import { Form, Link } from '@adonisjs/inertia/react'
import { Badge, Button, Card, Group, Stack, Text } from '@mantine/core'
import type { Data } from '@generated/data'
import { urlFor } from '~/client'
import { Guard } from '~/utils/permissions'
import LevelSettingsControl from '~/components/level_settings_control'

export default function ProgramCard({ program }: { program: Data.Program }) {
  const levels = program.levels ?? []

  return (
    <Card withBorder radius="md" padding="lg">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <div>
            <Group gap="xs">
              <Text fw={600} size="lg">
                {program.name}
              </Text>
              <Guard for="program.manage">
                {program.isActive ? (
                  <Badge variant="light" color="green" size="sm">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="light" color="yellow" size="sm">
                    Draft
                  </Badge>
                )}
              </Guard>
            </Group>
            <Text size="sm" c="dimmed">
              {program.description}
            </Text>
          </div>
          <Guard for="program.manage">
            <Group gap="xs">
              {!program.isActive && (
                <Form route="programs.update" routeParams={{ id: program.id }}>
                  {({ processing }) => (
                    <>
                      <input type="hidden" name="intent" value="activate" />
                      <Button size="xs" color="green" type="submit" loading={processing}>
                        Activate
                      </Button>
                    </>
                  )}
                </Form>
              )}
              <Button
                size="xs"
                variant="light"
                onClick={() => router.visit(urlFor('programs.edit', { id: program.id }))}
              >
                Edit
              </Button>
              <Button
                size="xs"
                variant="light"
                color="red"
                onClick={() => router.delete(urlFor('programs.destroy', { id: program.id }))}
              >
                Remove
              </Button>
            </Group>
          </Guard>
        </Group>

        <Stack gap="xs">
          {levels.map((level) => (
            <Card key={level.id} withBorder radius="sm" padding="sm">
              <Group gap="xs">
                <Text fw={500}>{level.name}</Text>
                <Badge variant="light" size="sm">
                  {level.ageGroup}
                </Badge>
                {level.available ? (
                  <Badge variant="light" color="green" size="sm">
                    Available
                  </Badge>
                ) : (
                  <Badge variant="light" color="red" size="sm">
                    Unavailable
                  </Badge>
                )}
              </Group>
              <Text size="sm" c="dimmed">
                {level.description}
              </Text>
              <Text size="sm">
                Capacity: {level.capacity} · {level.fee.formatted}
              </Text>
              <Group justify="space-between" align="center" mt="sm">
                <Guard for="program.manage">
                  <LevelSettingsControl level={level} />
                </Guard>
                {level.available && (
                  <Guard for="class.manage">
                    <Button
                      component={Link}
                      href={urlFor('swimming_classes.create', {}, { qs: { levelId: level.id } })}
                      size="xs"
                      variant="light"
                    >
                      Create class
                    </Button>
                  </Guard>
                )}
              </Group>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}
