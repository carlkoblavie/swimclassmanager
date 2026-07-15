import { Fragment, useState } from 'react'
import { router } from '@inertiajs/react'
import { Form } from '@adonisjs/inertia/react'
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Table,
  Text,
  Tooltip,
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
import ClassInlineBuilder from '~/components/class_inline_builder'
import LevelSettingsControl from '~/components/level_settings_control'

function LevelRow({
  level,
  canCreateClass,
  onCreateClass,
}: {
  level: Data.Level
  canCreateClass: boolean
  onCreateClass: () => void
}) {
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
              {level.stages.length > 0 && (
                <Text size="sm" c="dimmed">
                  Stages: {level.stages.map((stage) => stage.name).join(' → ')}
                </Text>
              )}
            </Stack>
          </Group>
          <Stack gap="xs" align="flex-end">
            {canCreateClass && (
              <Guard for="class.manage">
                <Button type="button" size="xs" variant="light" onClick={onCreateClass}>
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
  const [builderLevelId, setBuilderLevelId] = useState<number | null>(null)
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
              <Tooltip label="Edit program">
                <ActionIcon
                  variant="subtle"
                  aria-label="Edit"
                  onClick={() => router.visit(urlFor('programs.edit', { id: program.id }))}
                >
                  <IconPencil size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Remove program">
                <ActionIcon
                  variant="subtle"
                  color="red"
                  aria-label="Remove"
                  onClick={() => router.delete(urlFor('programs.destroy', { id: program.id }))}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Guard>
        </Table.Td>
      </Table.Tr>
      {expanded &&
        levels.map((level) => (
          <Fragment key={level.id}>
            <LevelRow
              level={level}
              canCreateClass={program.isActive && level.available}
              onCreateClass={() =>
                setBuilderLevelId((current) => (current === level.id ? null : level.id))
              }
            />
            {builderLevelId === level.id && (
              <Table.Tr bg="gray.0">
                <Table.Td />
                <Table.Td colSpan={4}>
                  <ClassInlineBuilder level={level} onClose={() => setBuilderLevelId(null)} />
                </Table.Td>
              </Table.Tr>
            )}
          </Fragment>
        ))}
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
