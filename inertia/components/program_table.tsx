import { Fragment, useEffect, useRef, useState } from 'react'
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
import { ActivityPopover, SkillPopover } from '~/components/stage_tree'
import type { StageActivityDraft, StageSkillDraft } from '~/components/stage_builder'

// Mockup's catalog columns: Program | Levels | Status | actions.
const ROW_GRID = {
  display: 'grid',
  gridTemplateColumns: '1fr 90px 130px 110px',
  gap: 16,
  alignItems: 'start',
} as const

type Stage = Data.Level['stages'][number]
type Skill = Stage['skills'][number]
type Activity = Skill['activities'][number]
type ActivityPayload = Omit<Activity, 'id'> & { id?: number }
type SkillPayload = Omit<Skill, 'id' | 'activities'> & {
  id?: number
  activities: ActivityPayload[]
}
type StagePayload = Omit<Stage, 'id' | 'code' | 'skills'> & {
  id?: number
  skills: SkillPayload[]
}

function stagePayload(stage: Stage): StagePayload {
  return {
    id: stage.id,
    name: stage.name,
    position: stage.position,
    classesCount: stage.classesCount,
    description: stage.description,
    skills: stage.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      passCriteria: skill.passCriteria,
      description: skill.description,
      activities: skill.activities.map((activity) => ({
        id: activity.id,
        name: activity.name,
        description: activity.description,
        applicationNotes: activity.applicationNotes,
      })),
    })),
  }
}

function programUpdatePayload(
  program: Data.Program,
  transformStage?: (level: Data.Level, stage: Stage, payload: StagePayload) => StagePayload
) {
  return {
    name: program.name,
    description: program.description,
    levels: program.levels.map((level) => ({
      id: level.id,
      name: level.name,
      ageGroup: level.ageGroup,
      description: level.description,
      defaultFee: level.defaultFee.raw / 100,
      classesCount: level.classesCount,
      audience: level.audience,
      stages: level.stages.map((stage) => {
        const payload = stagePayload(stage)
        return transformStage?.(level, stage, payload) ?? payload
      }),
    })),
  }
}

function StageAccordion({
  stage,
  open,
  onToggle,
  onAddSkill,
  onUpdateSkill,
  onRemoveSkill,
  onAddActivity,
  onUpdateActivity,
  onRemoveActivity,
}: {
  stage: Stage
  open: boolean
  onToggle: () => void
  onAddSkill: (skill: StageSkillDraft) => void
  onUpdateSkill: (skill: Skill, updated: StageSkillDraft) => void
  onRemoveSkill: (skill: Skill) => void
  onAddActivity: (skill: Skill, activity: StageActivityDraft) => void
  onUpdateActivity: (skill: Skill, activity: Activity, updated: StageActivityDraft) => void
  onRemoveActivity: (skill: Skill, activity: Activity) => void
}) {
  return (
    <Card withBorder shadow="none" padding={0} radius="md">
      <UnstyledButton w="100%" p="sm" px="md" onClick={onToggle}>
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon variant="light" radius="md" size={26}>
            <Text fz={12} fw={800}>
              {stage.position}
            </Text>
          </ThemeIcon>
          <Box style={{ minWidth: 0, flex: 1 }}>
            <Text fw={800} size="sm">
              {stage.name}
            </Text>
            {stage.description && (
              <Text size="xs" c="dimmed" lineClamp={1}>
                {stage.description}
              </Text>
            )}
          </Box>
          <Badge variant="light" color="gray" size="sm" style={{ flexShrink: 0 }}>
            {stage.skills.length} {stage.skills.length === 1 ? 'skill' : 'skills'}
          </Badge>
          {typeof stage.classesCount === 'number' && (
            <Badge variant="light" size="sm" style={{ flexShrink: 0 }}>
              {stage.classesCount} classes
            </Badge>
          )}
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
            <Group justify="space-between" align="center" p="xs">
              <Text size="sm" c="dimmed">
                No skills in this stage yet.
              </Text>
              <Guard for="program.manage">
                <SkillPopover
                  existingNames={stage.skills.map((skill) => skill.name)}
                  onSubmit={onAddSkill}
                  trigger={(openPopover) => (
                    <Button type="button" variant="default" size="xs" onClick={openPopover}>
                      Add skill
                    </Button>
                  )}
                />
              </Guard>
            </Group>
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
                    <Group justify="space-between" gap="sm" wrap="nowrap" align="flex-start">
                      <Group gap="sm" wrap="wrap">
                        <Text fw={800} size="sm">
                          {skill.name}
                        </Text>
                        <Badge variant="light" size="sm">
                          Pass: {skill.passCriteria}
                        </Badge>
                      </Group>
                      <Guard for="program.manage">
                        <Group gap={4} wrap="nowrap">
                          <ActivityPopover
                            onSubmit={(activity) => onAddActivity(skill, activity)}
                          />
                          <SkillPopover
                            existingNames={stage.skills
                              .filter((candidate) => candidate.id !== skill.id)
                              .map((candidate) => candidate.name)}
                            initial={{
                              id: skill.id,
                              name: skill.name,
                              passCriteria: skill.passCriteria,
                              description: skill.description ?? '',
                              activities: skill.activities.map((activity) => ({
                                id: activity.id,
                                name: activity.name,
                                description: activity.description ?? '',
                                applicationNotes: activity.applicationNotes ?? '',
                              })),
                            }}
                            submitLabel="Save"
                            onSubmit={(updated) => onUpdateSkill(skill, updated)}
                            trigger={(openPopover) => (
                              <Tooltip label="Edit skill">
                                <ActionIcon
                                  variant="subtle"
                                  size="sm"
                                  aria-label={`Edit skill ${skill.name}`}
                                  onClick={openPopover}
                                >
                                  <IconPencil size={14} />
                                </ActionIcon>
                              </Tooltip>
                            )}
                          />
                          <Tooltip label="Remove skill">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              size="sm"
                              aria-label={`Remove skill ${skill.name}`}
                              onClick={() => onRemoveSkill(skill)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Guard>
                    </Group>
                    {skill.description && (
                      <Text size="xs" c="dimmed" mt={4}>
                        {skill.description}
                      </Text>
                    )}
                  </Box>
                  {skill.activities.length === 0 ? (
                    <Group justify="space-between" align="center" p="sm" px="md">
                      <Text size="sm" c="dimmed">
                        No activities yet.
                      </Text>
                      <Guard for="program.manage">
                        <ActivityPopover
                          onSubmit={(activity) => onAddActivity(skill, activity)}
                          trigger={(openPopover) => (
                            <Button type="button" variant="default" size="xs" onClick={openPopover}>
                              Add activity
                            </Button>
                          )}
                        />
                      </Guard>
                    </Group>
                  ) : (
                    <Table verticalSpacing="xs" horizontalSpacing="md" fz="sm">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Activity</Table.Th>
                          <Table.Th>Description</Table.Th>
                          <Table.Th>Application notes</Table.Th>
                          <Guard for="program.manage">
                            <Table.Th w={76} />
                          </Guard>
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
                            <Guard for="program.manage">
                              <Table.Td>
                                <Group gap={4} wrap="nowrap" justify="flex-end">
                                  <ActivityPopover
                                    initial={{
                                      id: activity.id,
                                      name: activity.name,
                                      description: activity.description ?? '',
                                      applicationNotes: activity.applicationNotes ?? '',
                                    }}
                                    submitLabel="Save"
                                    onSubmit={(updated) =>
                                      onUpdateActivity(skill, activity, updated)
                                    }
                                    trigger={(openPopover) => (
                                      <Tooltip label="Edit activity">
                                        <ActionIcon
                                          variant="subtle"
                                          size="sm"
                                          aria-label={`Edit activity ${activity.name}`}
                                          onClick={openPopover}
                                        >
                                          <IconPencil size={14} />
                                        </ActionIcon>
                                      </Tooltip>
                                    )}
                                  />
                                  <Tooltip label="Remove activity">
                                    <ActionIcon
                                      variant="subtle"
                                      color="red"
                                      size="sm"
                                      aria-label={`Remove activity ${activity.name}`}
                                      onClick={() => onRemoveActivity(skill, activity)}
                                    >
                                      <IconTrash size={14} />
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              </Table.Td>
                            </Guard>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </Card>
              ))}
              <Guard for="program.manage">
                <div>
                  <SkillPopover
                    existingNames={stage.skills.map((skill) => skill.name)}
                    onSubmit={onAddSkill}
                    trigger={(openPopover) => (
                      <Button
                        type="button"
                        variant="default"
                        size="xs"
                        leftSection={<IconPlus size={14} />}
                        onClick={openPopover}
                      >
                        Add skill
                      </Button>
                    )}
                  />
                </div>
              </Guard>
            </Stack>
          )}
        </Box>
      )}
    </Card>
  )
}

function LevelCard({
  program,
  level,
  canCreateClass,
  onCreateClass,
}: {
  program: Data.Program
  level: Data.Level
  canCreateClass: boolean
  onCreateClass: () => void
}) {
  // Exclusive within the level: opening a stage closes its siblings.
  const [openStageId, setOpenStageId] = useState<number | null>(null)

  const submitStageChange = (stageId: number, update: (stage: StagePayload) => StagePayload) => {
    router.patch(
      urlFor('programs.update', { id: program.id }),
      programUpdatePayload(program, (candidateLevel, stage, payload) =>
        candidateLevel.id === level.id && stage.id === stageId ? update(payload) : payload
      ),
      { preserveScroll: true }
    )
  }

  const skillFromDraft = (skill: StageSkillDraft): SkillPayload => ({
    id: skill.id,
    name: skill.name,
    passCriteria: skill.passCriteria,
    description: skill.description,
    activities: skill.activities.map((activity) => ({
      id: activity.id,
      name: activity.name,
      description: activity.description,
      applicationNotes: activity.applicationNotes,
    })),
  })

  const activityFromDraft = (activity: StageActivityDraft): ActivityPayload => ({
    id: activity.id,
    name: activity.name,
    description: activity.description,
    applicationNotes: activity.applicationNotes,
  })

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
          <Badge variant="light" color="gray" size="sm">
            {level.audience === 'adult' ? 'Adults' : 'Children'}
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
        {typeof level.classesCount === 'number' && (
          <Text span size="sm" fw={600} c="dimmed">
            {' '}
            · {level.classesCount} classes
          </Text>
        )}
      </Text>

      {level.stages.length > 0 && (
        <Stack gap="sm" mt="sm">
          <Text size="xs" tt="uppercase" c="dimmed" fw={700} lts="0.05em">
            Stages
          </Text>
          {level.stages.map((stage) => (
            <StageAccordion
              key={stage.id}
              stage={stage}
              open={openStageId === stage.id}
              onToggle={() => setOpenStageId((current) => (current === stage.id ? null : stage.id))}
              onAddSkill={(skill) =>
                submitStageChange(stage.id, (payload) => ({
                  ...payload,
                  skills: [...payload.skills, skillFromDraft(skill)],
                }))
              }
              onUpdateSkill={(skill, updated) =>
                submitStageChange(stage.id, (payload) => ({
                  ...payload,
                  skills: payload.skills.map((candidate) =>
                    candidate.id === skill.id ? skillFromDraft(updated) : candidate
                  ),
                }))
              }
              onRemoveSkill={(skill) =>
                submitStageChange(stage.id, (payload) => ({
                  ...payload,
                  skills: payload.skills.filter((candidate) => candidate.id !== skill.id),
                }))
              }
              onAddActivity={(skill, activity) =>
                submitStageChange(stage.id, (payload) => ({
                  ...payload,
                  skills: payload.skills.map((candidate) =>
                    candidate.id === skill.id
                      ? {
                          ...candidate,
                          activities: [...candidate.activities, activityFromDraft(activity)],
                        }
                      : candidate
                  ),
                }))
              }
              onUpdateActivity={(skill, activity, updated) =>
                submitStageChange(stage.id, (payload) => ({
                  ...payload,
                  skills: payload.skills.map((candidate) =>
                    candidate.id === skill.id
                      ? {
                          ...candidate,
                          activities: candidate.activities.map((candidateActivity) =>
                            candidateActivity.id === activity.id
                              ? activityFromDraft(updated)
                              : candidateActivity
                          ),
                        }
                      : candidate
                  ),
                }))
              }
              onRemoveActivity={(skill, activity) =>
                submitStageChange(stage.id, (payload) => ({
                  ...payload,
                  skills: payload.skills.map((candidate) =>
                    candidate.id === skill.id
                      ? {
                          ...candidate,
                          activities: candidate.activities.filter(
                            (candidateActivity) => candidateActivity.id !== activity.id
                          ),
                        }
                      : candidate
                  ),
                }))
              }
            />
          ))}
        </Stack>
      )}
    </Card>
  )
}

function ProgramRows({
  program,
  termOptions,
  instructorOptions,
  pendingInstructorOptions,
  expanded,
  onToggle,
}: {
  program: Data.Program
  termOptions: Data.SwimYear[]
  instructorOptions: Data.Membership[]
  pendingInstructorOptions: Data.Invitation[]
  expanded: boolean
  onToggle: () => void
}) {
  const [builderLevelId, setBuilderLevelId] = useState<number | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const levels = program.levels ?? []

  // When this program opens (collapsing siblings above may shift the page),
  // bring its heading row back into view under the fixed app header. The
  // initially open program must not scroll on page load.
  const headerRef = useRef<HTMLDivElement>(null)
  const skippedInitial = useRef(false)

  useEffect(() => {
    if (!skippedInitial.current) {
      skippedInitial.current = true
      return
    }
    if (expanded) {
      headerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [expanded])

  return (
    <Box style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
      <Box ref={headerRef} px="lg" py="lg" style={{ ...ROW_GRID, scrollMarginTop: 76 }}>
        <Group gap="md" align="flex-start" wrap="nowrap">
          <ActionIcon
            variant="default"
            aria-label={`Toggle ${program.name} levels`}
            onClick={onToggle}
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
                  program={program}
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
                    instructorOptions={instructorOptions}
                    pendingInstructorOptions={pendingInstructorOptions}
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
  instructorOptions,
  pendingInstructorOptions,
}: {
  programs: Data.Program[]
  termOptions: Data.SwimYear[]
  instructorOptions: Data.Membership[]
  pendingInstructorOptions: Data.Invitation[]
}) {
  // Exclusive accordion: at most one program panel open, first one initially.
  const [openProgramId, setOpenProgramId] = useState<number | null>(programs[0]?.id ?? null)

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
        <ProgramRows
          key={program.id}
          program={program}
          termOptions={termOptions}
          instructorOptions={instructorOptions}
          pendingInstructorOptions={pendingInstructorOptions}
          expanded={openProgramId === program.id}
          onToggle={() =>
            setOpenProgramId((current) => (current === program.id ? null : program.id))
          }
        />
      ))}
    </Card>
  )
}
