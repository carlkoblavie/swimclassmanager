import { useEffect, useRef, useState } from 'react'
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
  Text,
  TextInput,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import { IconChevronDown, IconCopy, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import type { Data } from '@generated/data'
import { urlFor } from '~/client'
import { Guard } from '~/utils/permissions'
import ClassDuplicateForm from '~/components/class_duplicate_form'
import ClassEditForm from '~/components/class_edit_form'
import ClassForm, { type ClassSkillOption } from '~/components/class_form'
import ProgramLevelAddForm from '~/components/program_level_add_form'
import ProgramStageAddForm from '~/components/program_stage_add_form'

// Mockup's catalog columns: Program | Levels | Status | actions.
const ROW_GRID = {
  display: 'grid',
  gridTemplateColumns: '1fr 90px 130px 110px',
  gap: 16,
  alignItems: 'start',
} as const

type Stage = Data.Level['stages'][number]
type SwimmingClass = Data.SwimmingClass

function stripStageSuffix(name: string, stageName: string): string {
  const suffix = ` · ${stageName}`
  return name.endsWith(suffix) ? name.slice(0, -suffix.length) : name
}

function lessonSummary(swimmingClass: SwimmingClass) {
  if (swimmingClass.lessons.length === 0) {
    return 'No lessons yet'
  }
  const first = swimmingClass.lessons[0]
  const last = swimmingClass.lessons[swimmingClass.lessons.length - 1]
  return `${swimmingClass.lessons.length} ${swimmingClass.lessons.length === 1 ? 'lesson' : 'lessons'} · ${first.date.formatted}${last.id !== first.id ? ` – ${last.date.formatted}` : ''}`
}

function StageAccordion({
  stage,
  level,
  duplicateLevels,
  stageClasses,
  canCreateClass,
  termOptions,
  instructorOptions,
  pendingInstructorOptions,
  skillOptions,
  open,
  onToggle,
}: {
  stage: Stage
  level: Data.Level
  duplicateLevels: Data.Level[]
  stageClasses: SwimmingClass[]
  canCreateClass: boolean
  termOptions: Data.SwimYear[]
  instructorOptions: Data.Membership[]
  pendingInstructorOptions: Data.Invitation[]
  skillOptions: ClassSkillOption[]
  open: boolean
  onToggle: () => void
}) {
  const [addingClass, setAddingClass] = useState(false)
  const [editingClassId, setEditingClassId] = useState<number | null>(null)
  const [duplicatingClassId, setDuplicatingClassId] = useState<number | null>(null)
  const addFormRef = useRef<HTMLDivElement>(null)
  const editFormRef = useRef<HTMLDivElement>(null)
  const duplicateFormRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (addingClass) {
      addFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [addingClass])

  useEffect(() => {
    if (editingClassId !== null) {
      editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [editingClassId])

  useEffect(() => {
    if (duplicatingClassId !== null) {
      duplicateFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [duplicatingClassId])

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
          <Text size="xs" fw={700} c="dimmed" style={{ flexShrink: 0 }}>
            {stageClasses.length} {stageClasses.length === 1 ? 'CLASS' : 'CLASSES'}
          </Text>
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
          <Stack gap="sm">
            {addingClass && (
              <Box ref={addFormRef} style={{ scrollMarginTop: 84 }}>
                <ClassForm
                  level={level}
                  initialStageId={stage.id}
                  termOptions={termOptions}
                  instructorOptions={instructorOptions}
                  pendingInstructorOptions={pendingInstructorOptions}
                  skillOptions={skillOptions}
                  redirectBack
                  lockStage
                  onClose={() => setAddingClass(false)}
                />
              </Box>
            )}

            {stageClasses.length === 0 && !addingClass && (
              <Text size="sm" c="dimmed">
                No classes in this stage yet.
              </Text>
            )}

            {stageClasses.map((swimmingClass) => (
              <Stack key={swimmingClass.id} gap="sm">
                <Card withBorder shadow="none" padding="md" radius="md" style={{ minHeight: 92 }}>
                  <Group justify="space-between" gap="sm" wrap="nowrap" align="flex-start">
                    <Box style={{ minWidth: 0, flex: 1 }}>
                      <Group gap="xs" wrap="wrap">
                        <Anchor
                          component={Link}
                          href={urlFor('swimming_classes.show', { id: swimmingClass.id })}
                          fw={800}
                          size="sm"
                          c="inherit"
                        >
                          {stripStageSuffix(swimmingClass.name, stage.name)}
                        </Anchor>
                        <Badge variant="light" color="gray" size="sm">
                          {swimmingClass.code}
                        </Badge>
                        {swimmingClass.isCancelled && (
                          <Badge variant="light" color="red" size="sm">
                            Cancelled
                          </Badge>
                        )}
                        <Text size="sm" fw={700} c="dimmed">
                          {typeof swimmingClass.durationMinutes === 'number'
                            ? `${swimmingClass.durationMinutes} min`
                            : 'No duration'}
                        </Text>
                        <Anchor
                          component={Link}
                          href={`/lessons?classId=${swimmingClass.id}`}
                          size="sm"
                          fw={700}
                          c={swimmingClass.lessons.length === 0 ? 'dimmed' : undefined}
                        >
                          {lessonSummary(swimmingClass)}
                        </Anchor>
                      </Group>
                      {swimmingClass.skills.length > 0 ? (
                        <Group gap="md" wrap="wrap" mt={8}>
                          {swimmingClass.skills.map((skill) => (
                            <Text key={skill.id} size="sm" fw={600} c="gray.7">
                              {skill.name}
                            </Text>
                          ))}
                        </Group>
                      ) : (
                        <Text size="xs" c="dimmed" mt={6}>
                          No skills selected.
                        </Text>
                      )}
                      {swimmingClass.lessons.length === 0 && (
                        <Guard for="class.manage">
                          <Card
                            withBorder
                            shadow="none"
                            radius="md"
                            padding="xs"
                            bg="blue.0"
                            mt="sm"
                          >
                            <Group gap="xs" wrap="wrap">
                              <Text size="sm" fw={700}>
                                {stripStageSuffix(swimmingClass.name, stage.name)} created
                              </Text>
                              <Text size="sm" c="dimmed">
                                0 lessons scheduled
                              </Text>
                              <Anchor
                                component={Link}
                                href={urlFor('lessons.index', [], {
                                  qs: { classId: swimmingClass.id, generate: '1' },
                                })}
                                size="sm"
                                fw={700}
                              >
                                Generate lessons
                              </Anchor>
                            </Group>
                          </Card>
                        </Guard>
                      )}
                    </Box>
                    <Guard for="class.manage">
                      <Group gap={4} wrap="nowrap">
                        <Tooltip label="Edit class">
                          <ActionIcon
                            type="button"
                            variant="subtle"
                            color="gray"
                            size="sm"
                            aria-label={`Edit ${swimmingClass.name}`}
                            onClick={() => {
                              setAddingClass(false)
                              setDuplicatingClassId(null)
                              setEditingClassId((current) =>
                                current === swimmingClass.id ? null : swimmingClass.id
                              )
                            }}
                          >
                            <IconPencil size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Duplicate class">
                          <ActionIcon
                            type="button"
                            variant="subtle"
                            color="gray"
                            size="sm"
                            aria-label={`Duplicate ${swimmingClass.name}`}
                            onClick={() => {
                              setAddingClass(false)
                              setEditingClassId(null)
                              setDuplicatingClassId((current) =>
                                current === swimmingClass.id ? null : swimmingClass.id
                              )
                            }}
                          >
                            <IconCopy size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Form
                          route="swimming_classes.update"
                          routeParams={{ id: swimmingClass.id }}
                        >
                          {({ processing }) => (
                            <>
                              <input type="hidden" name="intent" value="cancel" />
                              <input type="hidden" name="redirectTo" value="back" />
                              <Tooltip label="Cancel class">
                                <ActionIcon
                                  type="submit"
                                  loading={processing}
                                  variant="subtle"
                                  color="red"
                                  size="sm"
                                  aria-label={`Cancel ${swimmingClass.name}`}
                                >
                                  <IconTrash size={14} />
                                </ActionIcon>
                              </Tooltip>
                            </>
                          )}
                        </Form>
                      </Group>
                    </Guard>
                  </Group>
                </Card>

                {editingClassId === swimmingClass.id && (
                  <Box ref={editFormRef} style={{ scrollMarginTop: 84 }}>
                    <ClassEditForm
                      swimmingClass={swimmingClass}
                      level={level}
                      termOptions={termOptions}
                      instructorOptions={instructorOptions}
                      pendingInstructorOptions={pendingInstructorOptions}
                      skillOptions={skillOptions}
                      redirectBack
                      lockStage
                      onCancel={() => setEditingClassId(null)}
                      onSuccess={() => setEditingClassId(null)}
                    />
                  </Box>
                )}

                {duplicatingClassId === swimmingClass.id && (
                  <Box ref={duplicateFormRef} style={{ scrollMarginTop: 84 }}>
                    <ClassDuplicateForm
                      sourceClass={swimmingClass}
                      levels={duplicateLevels}
                      termOptions={termOptions}
                      instructorOptions={instructorOptions}
                      pendingInstructorOptions={pendingInstructorOptions}
                      skillOptions={skillOptions}
                      redirectBack
                      onCancel={() => setDuplicatingClassId(null)}
                      onSuccess={() => setDuplicatingClassId(null)}
                    />
                  </Box>
                )}
              </Stack>
            ))}

            {canCreateClass && (
              <Guard for="class.manage">
                <Button
                  type="button"
                  variant="default"
                  size="xs"
                  leftSection={<IconPlus size={14} />}
                  onClick={() => {
                    setEditingClassId(null)
                    setDuplicatingClassId(null)
                    setAddingClass((current) => !current)
                  }}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {addingClass ? 'Close form' : 'Add class'}
                </Button>
              </Guard>
            )}
          </Stack>
        </Box>
      )}
    </Card>
  )
}

function LevelCard({
  program,
  level,
  classes,
  canCreateClass,
  duplicateLevels,
  termOptions,
  instructorOptions,
  pendingInstructorOptions,
  skillOptions,
}: {
  program: Data.Program
  level: Data.Level
  classes: SwimmingClass[]
  canCreateClass: boolean
  duplicateLevels: Data.Level[]
  termOptions: Data.SwimYear[]
  instructorOptions: Data.Membership[]
  pendingInstructorOptions: Data.Invitation[]
  skillOptions: ClassSkillOption[]
}) {
  // Exclusive within the level: opening a stage closes its siblings.
  const [openStageId, setOpenStageId] = useState<number | null>(null)
  const [addingStage, setAddingStage] = useState(false)
  const addStageFormRef = useRef<HTMLDivElement>(null)
  const activeClasses = classes.filter((swimmingClass) => !swimmingClass.isCancelled)
  const classesByStage = new Map<number, SwimmingClass[]>()
  for (const swimmingClass of activeClasses) {
    const list = classesByStage.get(swimmingClass.levelStageId) ?? []
    list.push(swimmingClass)
    classesByStage.set(swimmingClass.levelStageId, list)
  }

  useEffect(() => {
    if (addingStage) {
      addStageFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [addingStage])

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

      <Stack gap="sm" mt="sm">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Text size="xs" tt="uppercase" c="dimmed" fw={700} lts="0.05em">
              Stages
            </Text>
            <Badge variant="light" color="gray" size="xs">
              {level.stages.length}
            </Badge>
          </Group>
          <Guard for="program.manage">
            <Button
              type="button"
              variant="default"
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={() => setAddingStage((current) => !current)}
            >
              {addingStage ? 'Close form' : 'Add stage'}
            </Button>
          </Guard>
        </Group>

        {addingStage && (
          <Box ref={addStageFormRef} style={{ scrollMarginTop: 84 }}>
            <ProgramStageAddForm
              program={program}
              level={level}
              onCancel={() => setAddingStage(false)}
              onSuccess={() => setAddingStage(false)}
            />
          </Box>
        )}

        {level.stages.length === 0 ? (
          <Text size="sm" c="dimmed">
            This level has no stages yet.
          </Text>
        ) : (
          level.stages.map((stage) => (
            <StageAccordion
              key={stage.id}
              stage={stage}
              level={level}
              duplicateLevels={duplicateLevels}
              stageClasses={classesByStage.get(stage.id) ?? []}
              canCreateClass={canCreateClass}
              termOptions={termOptions}
              instructorOptions={instructorOptions}
              pendingInstructorOptions={pendingInstructorOptions}
              skillOptions={skillOptions}
              open={openStageId === stage.id}
              onToggle={() => setOpenStageId((current) => (current === stage.id ? null : stage.id))}
            />
          ))
        )}
      </Stack>
    </Card>
  )
}

function ProgramRows({
  program,
  classes,
  termOptions,
  instructorOptions,
  pendingInstructorOptions,
  skillOptions,
  expanded,
  onToggle,
}: {
  program: Data.Program
  classes: SwimmingClass[]
  termOptions: Data.SwimYear[]
  instructorOptions: Data.Membership[]
  pendingInstructorOptions: Data.Invitation[]
  skillOptions: ClassSkillOption[]
  expanded: boolean
  onToggle: () => void
}) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [addingLevel, setAddingLevel] = useState(false)
  const levels = program.levels ?? []

  // When this program opens (collapsing siblings above may shift the page),
  // bring its heading row back into view under the fixed app header. The
  // initially open program must not scroll on page load.
  const headerRef = useRef<HTMLDivElement>(null)
  const addLevelFormRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    if (addingLevel) {
      addLevelFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [addingLevel])

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
          <Group justify="space-between" align="center" pl={64} pr="lg" py="sm">
            <Group gap="xs">
              <Text size="xs" tt="uppercase" c="dimmed" fw={700} lts="0.05em">
                Levels
              </Text>
              <Badge variant="light" color="gray" size="xs">
                {levels.length}
              </Badge>
            </Group>
            <Guard for="program.manage">
              <Button
                type="button"
                variant="default"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={() => setAddingLevel((current) => !current)}
              >
                {addingLevel ? 'Close form' : 'Add level'}
              </Button>
            </Guard>
          </Group>
          {addingLevel && (
            <Box ref={addLevelFormRef} ml={64} mr="lg" mb="md" style={{ scrollMarginTop: 84 }}>
              <ProgramLevelAddForm
                program={program}
                onCancel={() => setAddingLevel(false)}
                onSuccess={() => setAddingLevel(false)}
              />
            </Box>
          )}
          {levels.length === 0 && (
            <Text size="sm" c="dimmed" pl={64} pb="md">
              This program has no levels yet.
            </Text>
          )}
          {levels.map((level) => (
            <Box key={level.id} ml={64} mr="lg" mb="md">
              <LevelCard
                program={program}
                level={level}
                classes={classes.filter((swimmingClass) => swimmingClass.levelId === level.id)}
                canCreateClass={program.isActive && level.available}
                duplicateLevels={levels}
                termOptions={termOptions}
                instructorOptions={instructorOptions}
                pendingInstructorOptions={pendingInstructorOptions}
                skillOptions={skillOptions}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default function ProgramTable({
  programs,
  classes,
  termOptions,
  instructorOptions,
  pendingInstructorOptions,
  skillOptions,
}: {
  programs: Data.Program[]
  classes: SwimmingClass[]
  termOptions: Data.SwimYear[]
  instructorOptions: Data.Membership[]
  pendingInstructorOptions: Data.Invitation[]
  skillOptions: ClassSkillOption[]
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
          classes={classes.filter((swimmingClass) => swimmingClass.level?.programId === program.id)}
          termOptions={termOptions}
          instructorOptions={instructorOptions}
          pendingInstructorOptions={pendingInstructorOptions}
          skillOptions={skillOptions}
          expanded={openProgramId === program.id}
          onToggle={() =>
            setOpenProgramId((current) => (current === program.id ? null : program.id))
          }
        />
      ))}
    </Card>
  )
}
