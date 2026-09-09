import { useEffect, useRef, useState } from 'react'
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Collapse,
  Container,
  Divider,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconChevronDown, IconCopy, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import { urlFor } from '~/client'
import { Guard } from '~/utils/permissions'
import ClassDuplicateForm from '~/components/class_duplicate_form'
import ClassForm from '~/components/class_form'
import type { ClassSkillOption } from '~/components/class_form'
import ClassDetails from '~/components/class_details'
import MetaStrip from '~/components/meta_strip'

type PageProps = InertiaProps<{
  level: Data.Level.Variants['forClassOption']
  classes: Data.SwimmingClass[]
  canManageClasses: boolean
  termOptions: Data.SwimYear[]
  instructorOptions: Data.Membership[]
  pendingInstructorOptions: Data.Invitation[]
  skillBankSkills: ClassSkillOption[]
}>

function stripStageSuffix(name: string, stageName: string): string {
  const suffix = ` · ${stageName}`
  return name.endsWith(suffix) ? name.slice(0, -suffix.length) : name
}

export default function LevelsShow({
  level,
  classes,
  termOptions,
  instructorOptions,
  pendingInstructorOptions,
  skillBankSkills,
}: PageProps) {
  const skillCount = level.stages.reduce((total, stage) => total + stage.skills.length, 0)
  const levelLessonCount = classes[0]?.levelLessonCount ?? 0

  // Group active classes by stage.
  const activeClasses = classes.filter((swimmingClass) => !swimmingClass.isCancelled)
  const classesByStage = new Map<number, Data.SwimmingClass[]>()
  for (const swimmingClass of activeClasses) {
    const list = classesByStage.get(swimmingClass.levelStageId) ?? []
    list.push(swimmingClass)
    classesByStage.set(swimmingClass.levelStageId, list)
  }

  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())
  const toggleStage = (stageId: number) =>
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(stageId)) next.delete(stageId)
      else next.add(stageId)
      return next
    })

  const [addStageId, setAddStageId] = useState<number | null>(null)
  const [duplicateClassId, setDuplicateClassId] = useState<number | null>(null)
  const addFormRef = useRef<HTMLDivElement>(null)
  const duplicateFormRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (addStageId !== null) {
      addFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [addStageId])

  useEffect(() => {
    if (duplicateClassId !== null) {
      duplicateFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [duplicateClassId])

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Anchor component={Link} href={urlFor('programs.show', { id: level.programId })} size="sm">
          ← {level.programName || 'Program'}
        </Anchor>

        {/* Level hero */}
        <Card padding={0}>
          <Group justify="space-between" align="flex-start" p="lg" wrap="wrap">
            <Group gap="md" align="flex-start" wrap="nowrap">
              <Box
                bg="aqua.0"
                c="aqua.8"
                w={52}
                h={52}
                style={{
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Text fw={800} fz="md">
                  {level.ageGroup}
                </Text>
              </Box>
              <div>
                <Group gap="xs">
                  <Title order={1} fz="h2">
                    {level.name}
                  </Title>
                  <Badge variant="light" color="gray" size="sm">
                    {level.code}
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
                <Text size="sm" c="dimmed" mt={4} maw="60ch">
                  {level.description}
                </Text>
              </div>
            </Group>
            <Guard for="program.manage">
              <Button
                component={Link}
                href={urlFor('programs.edit', { id: level.programId })}
                variant="default"
              >
                Edit curriculum
              </Button>
            </Guard>
          </Group>
          <Divider />
          <MetaStrip
            items={[
              { label: 'Age range', value: level.ageGroup },
              { label: 'Audience', value: level.audience === 'adult' ? 'Adults' : 'Children' },
              {
                label: 'Capacity',
                value: typeof level.capacity === 'number' ? `${level.capacity} learners` : '—',
              },
              { label: 'Your fee', value: level.fee.formatted },
              {
                label: 'Lessons generated',
                value:
                  typeof level.classesCount === 'number'
                    ? `${levelLessonCount} of ${level.classesCount}`
                    : levelLessonCount,
              },
              { label: 'Stages', value: level.stages.length },
              { label: 'Skills', value: skillCount },
            ]}
          />
        </Card>

        {/* Stages, each listing its classes */}
        <Guard for="class.view">
          <Text size="xs" tt="uppercase" c="dimmed" fw={700} mt="sm">
            Stages
          </Text>

          {level.stages.length === 0 ? (
            <Text size="sm" c="dimmed">
              No stages yet — add curriculum to the program first.
            </Text>
          ) : (
            level.stages.map((stage) => {
              const stageClasses = classesByStage.get(stage.id) ?? []
              const isOpen = !collapsed.has(stage.id)

              return (
                <Card key={stage.id} padding={0} withBorder>
                  <Group justify="space-between" wrap="nowrap" p="md">
                    <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                      <ThemeIcon variant="light" radius="xl" size="md">
                        <Text size="xs" fw={700}>
                          {stage.position}
                        </Text>
                      </ThemeIcon>
                      <Box style={{ minWidth: 0 }}>
                        <Text fw={700}>{stage.name}</Text>
                        {stage.description && (
                          <Text size="sm" c="dimmed">
                            {stage.description}
                          </Text>
                        )}
                      </Box>
                    </Group>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="xs" fw={700} c="dimmed">
                        {stageClasses.length} {stageClasses.length === 1 ? 'CLASS' : 'CLASSES'}
                      </Text>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        aria-label={isOpen ? 'Collapse stage' : 'Expand stage'}
                        onClick={() => toggleStage(stage.id)}
                      >
                        <IconChevronDown
                          size={18}
                          style={{
                            transform: isOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 150ms ease',
                          }}
                        />
                      </ActionIcon>
                    </Group>
                  </Group>

                  <Collapse expanded={isOpen}>
                    <Divider />
                    <Stack gap="sm" p="md">
                      {stageClasses.length === 0 && addStageId !== stage.id && (
                        <Text size="sm" c="dimmed">
                          No classes in this stage yet.
                        </Text>
                      )}

                      {stageClasses.map((swimmingClass) => (
                        <Stack key={swimmingClass.id} gap="sm">
                          <Card withBorder shadow="none" padding="md">
                            <Group
                              justify="space-between"
                              wrap="nowrap"
                              align="flex-start"
                              style={{ position: 'relative' }}
                            >
                              <Box style={{ minWidth: 0, width: '100%' }}>
                                <ClassDetails
                                  swimmingClass={swimmingClass}
                                  displayName={stripStageSuffix(swimmingClass.name, stage.name)}
                                />
                              </Box>
                              <Guard for="class.manage">
                                <Group
                                  gap={2}
                                  wrap="nowrap"
                                  style={{ position: 'absolute', top: 0, right: 0 }}
                                >
                                  <Tooltip label="Edit">
                                    <ActionIcon
                                      component={Link}
                                      href={urlFor('swimming_classes.edit', {
                                        id: swimmingClass.id,
                                      })}
                                      variant="subtle"
                                      color="gray"
                                      aria-label="Edit class"
                                    >
                                      <IconPencil size={16} />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Duplicate">
                                    <ActionIcon
                                      type="button"
                                      variant="subtle"
                                      color="gray"
                                      aria-label="Duplicate class"
                                      onClick={() => {
                                        setAddStageId(null)
                                        setDuplicateClassId((current) =>
                                          current === swimmingClass.id ? null : swimmingClass.id
                                        )
                                      }}
                                    >
                                      <IconCopy size={16} />
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
                                            aria-label="Cancel class"
                                          >
                                            <IconTrash size={16} />
                                          </ActionIcon>
                                        </Tooltip>
                                      </>
                                    )}
                                  </Form>
                                </Group>
                              </Guard>
                            </Group>
                          </Card>
                          {duplicateClassId === swimmingClass.id && (
                            <Box ref={duplicateFormRef} style={{ scrollMarginTop: 84 }}>
                              <ClassDuplicateForm
                                sourceClass={swimmingClass}
                                levels={[level]}
                                termOptions={termOptions}
                                skillOptions={skillBankSkills}
                                redirectBack
                                onCancel={() => setDuplicateClassId(null)}
                                onSuccess={() => setDuplicateClassId(null)}
                              />
                            </Box>
                          )}
                        </Stack>
                      ))}

                      <Guard for="class.manage">
                        {addStageId === stage.id ? (
                          <Box ref={addFormRef} style={{ scrollMarginTop: 84 }}>
                            <ClassForm
                              key={stage.id}
                              level={level}
                              initialStageId={stage.id}
                              termOptions={termOptions}
                              skillOptions={skillBankSkills}
                              onClose={() => setAddStageId(null)}
                            />
                          </Box>
                        ) : (
                          <Button
                            variant="light"
                            leftSection={<IconPlus size={14} />}
                            onClick={() => {
                              setDuplicateClassId(null)
                              setAddStageId(stage.id)
                            }}
                            style={{ alignSelf: 'flex-start' }}
                          >
                            Add class
                          </Button>
                        )}
                      </Guard>
                    </Stack>
                  </Collapse>
                </Card>
              )
            })
          )}
        </Guard>
      </Stack>
    </Container>
  )
}
