import { Fragment, useState } from 'react'
import { router } from '@inertiajs/react'
import { Form, Link } from '@adonisjs/inertia/react'
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import { IconChevronDown, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import type { Data } from '@generated/data'
import { urlFor } from '~/client'
import { Guard } from '~/utils/permissions'
import ClassInlineBuilder from '~/components/class_inline_builder'

// Mockup's catalog columns: Program | Levels | Status | actions.
const ROW_GRID = {
  display: 'grid',
  gridTemplateColumns: '1fr 90px 130px 110px',
  gap: 16,
  alignItems: 'start',
} as const

type Stage = Data.Level['stages'][number]

function StageAccordion({ stage }: { stage: Stage }) {
  const [open, setOpen] = useState(false)

  return (
    <Card withBorder shadow="none" padding={0} radius="md">
      <UnstyledButton w="100%" p="sm" px="md" onClick={() => setOpen((value) => !value)}>
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon variant="light" radius="md" size={26}>
            <Text fz={12} fw={800}>
              {stage.position}
            </Text>
          </ThemeIcon>
          <Text fw={800} size="sm">
            {stage.name}
          </Text>
          {stage.description && (
            <Text size="xs" c="dimmed" lineClamp={1}>
              · {stage.description}
            </Text>
          )}
          <Badge variant="light" color="gray" size="sm" ml="auto" style={{ flexShrink: 0 }}>
            {stage.skills.length} {stage.skills.length === 1 ? 'skill' : 'skills'}
          </Badge>
          <IconChevronDown
            size={14}
            style={{
              flexShrink: 0,
              transition: 'transform .15s',
              transform: open ? 'rotate(180deg)' : undefined,
            }}
          />
        </Group>
      </UnstyledButton>

      {open && (
        <Box bg="gray.0" p="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
          {stage.skills.length === 0 ? (
            <Text size="sm" c="dimmed" p="xs">
              No skills in this stage yet.
            </Text>
          ) : (
            <Stack gap="sm">
              {stage.skills.map((skill) => (
                <Card key={skill.id} withBorder shadow="none" padding={0} radius="md">
                  <Box
                    p="sm"
                    px="md"
                    bg="gray.0"
                    style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
                  >
                    <Group gap="sm" wrap="wrap">
                      <Text fw={800} size="sm">
                        {skill.name}
                      </Text>
                      <Badge variant="light" size="sm">
                        Pass: {skill.passCriteria}
                      </Badge>
                    </Group>
                    {skill.description && (
                      <Text size="xs" c="dimmed" mt={4}>
                        {skill.description}
                      </Text>
                    )}
                  </Box>
                  {skill.activities.length === 0 ? (
                    <Text size="sm" c="dimmed" p="sm" px="md">
                      No activities yet.
                    </Text>
                  ) : (
                    <Table verticalSpacing="xs" horizontalSpacing="md" fz="sm">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Activity</Table.Th>
                          <Table.Th>Description</Table.Th>
                          <Table.Th>Application notes</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {skill.activities.map((activity) => (
                          <Table.Tr key={activity.id}>
                            <Table.Td fw={700} style={{ whiteSpace: 'nowrap' }}>
                              {activity.name}
                            </Table.Td>
                            <Table.Td c="dimmed">{activity.description || '—'}</Table.Td>
                            <Table.Td c="dimmed">{activity.applicationNotes || '—'}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Card>
  )
}

function LevelCard({
  level,
  canCreateClass,
  onCreateClass,
}: {
  level: Data.Level
  canCreateClass: boolean
  onCreateClass: () => void
}) {
  return (
    <Card withBorder shadow="none" radius="md">
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Group gap="xs" wrap="wrap">
          <Anchor
            component={Link}
            href={urlFor('levels.show', { id: level.id })}
            fw={800}
            c="aqua.8"
          >
            {level.name}
          </Anchor>
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
          <Badge variant="light" color="gray" size="sm">
            {level.code}
          </Badge>
        </Group>
        {canCreateClass && (
          <Guard for="class.manage">
            <Button
              type="button"
              size="xs"
              variant="light"
              leftSection={<IconPlus size={14} />}
              onClick={onCreateClass}
            >
              Create class
            </Button>
          </Guard>
        )}
      </Group>

      <Text size="sm" c="dimmed" mt="xs" maw="80ch">
        {level.description}
      </Text>
      <Text fw={800} mt="xs">
        {typeof level.capacity === 'number' && (
          <Text span size="sm" fw={600} c="dimmed">
            Capacity {level.capacity} ·{' '}
          </Text>
        )}
        {level.fee.formatted}
      </Text>

      {level.stages.length > 0 && (
        <Stack gap="sm" mt="sm">
          <Text size="xs" tt="uppercase" c="dimmed" fw={700} lts="0.05em">
            Stages
          </Text>
          {level.stages.map((stage) => (
            <StageAccordion key={stage.id} stage={stage} />
          ))}
        </Stack>
      )}
    </Card>
  )
}

function ProgramRows({
  program,
  termOptions,
}: {
  program: Data.Program
  termOptions: Data.SwimYear[]
}) {
  const [expanded, setExpanded] = useState(true)
  const [builderLevelId, setBuilderLevelId] = useState<number | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const levels = program.levels ?? []

  return (
    <Box style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
      <Box px="lg" py="lg" style={ROW_GRID}>
        <Group gap="md" align="flex-start" wrap="nowrap">
          <ActionIcon
            variant="default"
            aria-label={`Toggle ${program.name} levels`}
            onClick={() => setExpanded((value) => !value)}
            style={{
              transition: 'transform .15s',
              transform: expanded ? 'rotate(180deg)' : undefined,
            }}
          >
            <IconChevronDown size={16} />
          </ActionIcon>
          <div>
            <Group gap="xs">
              <Anchor
                component={Link}
                href={urlFor('programs.show', { id: program.id })}
                fw={800}
                fz="lg"
                c="inherit"
              >
                {program.name}
              </Anchor>
              <Badge variant="light" color="gray" size="sm">
                {program.code}
              </Badge>
            </Group>
            <Text size="sm" c="dimmed" mt={4} maw="70ch">
              {program.description}
            </Text>
          </div>
        </Group>

        <Text fw={600} pt={4}>
          {levels.length}
        </Text>

        <div>
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
        </div>

        <Guard for="program.manage">
          <Group gap={4} justify="flex-end" wrap="nowrap">
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
                aria-label={`Remove ${program.name}`}
                onClick={() => {
                  setConfirmName('')
                  setDeleteOpen(true)
                }}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
            <Modal
              opened={deleteOpen}
              onClose={() => setDeleteOpen(false)}
              title={`Delete ${program.name}?`}
              centered
            >
              <Stack gap="sm">
                <Text size="sm">
                  This permanently deletes <b>{program.name}</b> — all of its levels, stages,
                  skills, and activities, and every class and lesson scheduled under it, across all
                  schools. This cannot be undone.
                </Text>
                <TextInput
                  label={`Type "${program.name}" to confirm`}
                  value={confirmName}
                  onChange={(event) => setConfirmName(event.currentTarget.value)}
                  data-autofocus
                />
                <Group justify="flex-end" gap="sm">
                  <Button type="button" variant="default" onClick={() => setDeleteOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    color="red"
                    disabled={confirmName.trim() !== program.name}
                    onClick={() =>
                      router.delete(urlFor('programs.destroy', { id: program.id }), {
                        data: { confirmName: confirmName.trim() },
                      })
                    }
                  >
                    Delete program
                  </Button>
                </Group>
              </Stack>
            </Modal>
          </Group>
        </Guard>
      </Box>

      {expanded && (
        <Box bg="gray.0" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
          <Group gap="xs" pl={64} py="sm">
            <Text size="xs" tt="uppercase" c="dimmed" fw={700} lts="0.05em">
              Levels
            </Text>
            <Badge variant="light" color="gray" size="xs">
              {levels.length}
            </Badge>
          </Group>
          {levels.length === 0 && (
            <Text size="sm" c="dimmed" pl={64} pb="md">
              This program has no levels yet.
            </Text>
          )}
          {levels.map((level) => (
            <Fragment key={level.id}>
              <Box ml={64} mr="lg" mb="md">
                <LevelCard
                  level={level}
                  canCreateClass={program.isActive && level.available}
                  onCreateClass={() =>
                    setBuilderLevelId((current) => (current === level.id ? null : level.id))
                  }
                />
              </Box>
              {builderLevelId === level.id && (
                <Box ml={64} mr="lg" mb="md">
                  <ClassInlineBuilder
                    level={level}
                    termOptions={termOptions}
                    onClose={() => setBuilderLevelId(null)}
                  />
                </Box>
              )}
            </Fragment>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default function ProgramTable({
  programs,
  termOptions,
}: {
  programs: Data.Program[]
  termOptions: Data.SwimYear[]
}) {
  return (
    <Card padding={0}>
      <Box px="lg" py="md" style={ROW_GRID}>
        <Text fw={800} pl={46}>
          Program
        </Text>
        <Text fw={800}>Levels</Text>
        <Text fw={800}>Status</Text>
        <span />
      </Box>
      {programs.map((program) => (
        <ProgramRows key={program.id} program={program} termOptions={termOptions} />
      ))}
    </Card>
  )
}
