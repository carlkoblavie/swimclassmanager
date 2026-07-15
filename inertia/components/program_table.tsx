import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Form, Link } from '@adonisjs/inertia/react'
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Table,
  Text,
} from '@mantine/core'
import {
  IconChevronDown,
  IconChevronRight,
  IconCornerDownRight,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react'
import type { Data } from '@generated/data'
import { urlFor } from '~/client'
import { Guard } from '~/utils/permissions'
import LevelSettingsControl from '~/components/level_settings_control'

function LevelRow({ level }: { level: Data.Level }) {
  return (
    <Table.Tr bg="gray.0">
      <Table.Td />
      <Table.Td colSpan={4}>
        {/* Indent under the parent program row to read as a child entry. */}
        <Group justify="space-between" align="flex-start" wrap="wrap" pl="xl">
          <Group gap="xs" align="flex-start" wrap="nowrap">
            <IconCornerDownRight
              size={16}
              stroke={1.6}
              color="var(--mantine-color-dimmed)"
              aria-hidden
              style={{ marginTop: 4 }}
            />
            <Stack gap={4}>
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
            </Stack>
          </Group>
          <Stack gap="xs" align="flex-end">
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
            <Guard for="program.manage">
              <LevelSettingsControl level={level} />
            </Guard>
          </Stack>
        </Group>
      </Table.Td>
    </Table.Tr>
  )
}

function ProgramRows({ program }: { program: Data.Program }) {
  const [expanded, setExpanded] = useState(true)
  const levels = program.levels ?? []

  return (
    <>
      <Table.Tr>
        <Table.Td>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label={`Toggle ${program.name} levels`}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
          </ActionIcon>
        </Table.Td>
        <Table.Td>
          <Text fw={600}>{program.name}</Text>
          <Text size="sm" c="dimmed">
            {program.description}
          </Text>
        </Table.Td>
        <Table.Td>{levels.length}</Table.Td>
        <Table.Td>
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
        </Table.Td>
        <Table.Td>
          <Guard for="program.manage">
            <Group gap="xs" justify="flex-end" wrap="nowrap">
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
              <ActionIcon
                variant="subtle"
                aria-label="Edit"
                onClick={() => router.visit(urlFor('programs.edit', { id: program.id }))}
              >
                <IconPencil size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="red"
                aria-label="Remove"
                onClick={() => router.delete(urlFor('programs.destroy', { id: program.id }))}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          </Guard>
        </Table.Td>
      </Table.Tr>
      {expanded && levels.map((level) => <LevelRow key={level.id} level={level} />)}
    </>
  )
}

export default function ProgramTable({ programs }: { programs: Data.Program[] }) {
  return (
    <Card padding={0}>
      <Table verticalSpacing="sm" horizontalSpacing="lg">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={48} />
            <Table.Th>Program</Table.Th>
            <Table.Th>Levels</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {programs.map((program) => (
            <ProgramRows key={program.id} program={program} />
          ))}
        </Table.Tbody>
      </Table>
    </Card>
  )
}
