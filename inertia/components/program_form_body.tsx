import { Fragment, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core'
import {
  IconFileDescription,
  IconPencil,
  IconPlus,
  IconStack2,
  IconTrash,
} from '@tabler/icons-react'
import LevelForm, { type LevelDraft } from '~/components/level_form'
import StageBuilder, {
  type StageActivityDraft,
  type StageDraft,
  type StageSkillDraft,
} from '~/components/stage_builder'
import StageTree from '~/components/stage_tree'

type Props = {
  errors: Record<string, string>
  initial?: { name: string; description: string; levels: LevelDraft[] }
}

type StageTarget = { levelIndex: number; stageIndex: number | null }

function SectionHeading({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <Group gap="sm" wrap="nowrap">
      <ThemeIcon variant="light" size="lg" radius="md">
        {icon}
      </ThemeIcon>
      <div>
        <Title order={3} fz="lg">
          {title}
        </Title>
        <Text size="sm" c="dimmed">
          {subtitle}
        </Text>
      </div>
    </Group>
  )
}

function parseCount(value: string): number {
  const count = Number(value)
  return Number.isFinite(count) ? count : 0
}

function formatDraftAmount(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const [whole, decimal] = trimmed.split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decimal === undefined ? grouped : `${grouped}.${decimal}`
}

function classAllocation(level: LevelDraft) {
  const total = parseCount(level.classesCount)
  const used = level.stages.reduce((sum, stage) => sum + parseCount(stage.classesCount), 0)
  return {
    total,
    used,
    remaining: total - used,
    balanced: level.stages.length === 0 || used === total,
  }
}

export default function ProgramFormBody({ errors, initial }: Props) {
  const [levels, setLevels] = useState<LevelDraft[]>(initial?.levels ?? [])
  // 'new' shows the inline add form; a number edits that level in place.
  const [levelFormTarget, setLevelFormTarget] = useState<'new' | number | null>(null)
  const [stageTarget, setStageTarget] = useState<StageTarget | null>(null)

  const openLevelForm = (target: 'new' | number) => {
    setStageTarget(null)
    setLevelFormTarget(target)
  }

  const closeLevelForm = () => setLevelFormTarget(null)

  const openStageForm = (target: StageTarget) => {
    setLevelFormTarget(null)
    setStageTarget(target)
  }

  const closeStageForm = () => setStageTarget(null)

  const remove = (index: number) => setLevels((current) => current.filter((_, i) => i !== index))
  const save = (draft: LevelDraft) => {
    setLevels((current) =>
      levelFormTarget === 'new' || levelFormTarget === null
        ? [...current, draft]
        : current.map((level, i) => (i === levelFormTarget ? draft : level))
    )
    setLevelFormTarget(null)
  }

  const saveStage = (draft: StageDraft) => {
    if (!stageTarget) return
    setLevels((current) =>
      current.map((level, i) => {
        if (i !== stageTarget.levelIndex) return level
        const stages =
          stageTarget.stageIndex === null
            ? [...level.stages, draft]
            : level.stages.map((stage, s) => (s === stageTarget.stageIndex ? draft : stage))
        return { ...level, stages }
      })
    )
    setStageTarget(null)
  }
  const removeStage = (levelIndex: number, stageIndex: number) =>
    setLevels((current) =>
      current.map((level, i) =>
        i === levelIndex
          ? { ...level, stages: level.stages.filter((_, s) => s !== stageIndex) }
          : level
      )
    )

  const updateStage = (
    levelIndex: number,
    stageIndex: number,
    updater: (stage: StageDraft) => StageDraft
  ) =>
    setLevels((current) =>
      current.map((level, i) =>
        i === levelIndex
          ? {
              ...level,
              stages: level.stages.map((stage, s) => (s === stageIndex ? updater(stage) : stage)),
            }
          : level
      )
    )

  const addSkill = (levelIndex: number, stageIndex: number, skill: StageSkillDraft) =>
    updateStage(levelIndex, stageIndex, (stage) => ({
      ...stage,
      skills: [...stage.skills, skill],
    }))

  const updateSkill = (
    levelIndex: number,
    stageIndex: number,
    skillIndex: number,
    skill: StageSkillDraft
  ) =>
    updateStage(levelIndex, stageIndex, (stage) => ({
      ...stage,
      skills: stage.skills.map((existing, s) => (s === skillIndex ? skill : existing)),
    }))

  const removeSkill = (levelIndex: number, stageIndex: number, skillIndex: number) =>
    updateStage(levelIndex, stageIndex, (stage) => ({
      ...stage,
      skills: stage.skills.filter((_, s) => s !== skillIndex),
    }))

  const addActivity = (
    levelIndex: number,
    stageIndex: number,
    skillIndex: number,
    activity: StageActivityDraft
  ) =>
    updateStage(levelIndex, stageIndex, (stage) => ({
      ...stage,
      skills: stage.skills.map((skill, s) =>
        s === skillIndex ? { ...skill, activities: [...skill.activities, activity] } : skill
      ),
    }))

  const updateActivity = (
    levelIndex: number,
    stageIndex: number,
    skillIndex: number,
    activityIndex: number,
    activity: StageActivityDraft
  ) =>
    updateStage(levelIndex, stageIndex, (stage) => ({
      ...stage,
      skills: stage.skills.map((skill, s) =>
        s === skillIndex
          ? {
              ...skill,
              activities: skill.activities.map((existing, a) =>
                a === activityIndex ? activity : existing
              ),
            }
          : skill
      ),
    }))

  const removeActivity = (
    levelIndex: number,
    stageIndex: number,
    skillIndex: number,
    activityIndex: number
  ) =>
    updateStage(levelIndex, stageIndex, (stage) => ({
      ...stage,
      skills: stage.skills.map((skill, s) =>
        s === skillIndex
          ? { ...skill, activities: skill.activities.filter((_, a) => a !== activityIndex) }
          : skill
      ),
    }))

  return (
    <>
      <Stack gap="lg">
        <Card>
          <Stack gap="md">
            <SectionHeading
              icon={<IconFileDescription size={20} stroke={1.6} />}
              title="Basic information"
              subtitle="General details about the program, visible to staff and parents."
            />
            <TextInput
              label="Program name"
              name="name"
              defaultValue={initial?.name}
              error={errors.name}
            />
            <Textarea
              label="Description"
              name="description"
              defaultValue={initial?.description}
              error={errors.description}
              autosize
              minRows={3}
            />
          </Stack>
        </Card>

        <Group justify="space-between" align="flex-start">
          <SectionHeading
            icon={<IconStack2 size={20} stroke={1.6} />}
            title="Curriculum hierarchy"
            subtitle="Define the progression path: the levels swimmers move through."
          />
          <Button variant="light" size="sm" onClick={() => openLevelForm('new')}>
            Add level
          </Button>
        </Group>

        {levelFormTarget === 'new' && <LevelForm onCancel={closeLevelForm} onSave={save} />}

        {levels.length === 0 ? (
          <Card>
            <Text c="dimmed" size="sm">
              No levels added yet. Add at least one.
            </Text>
          </Card>
        ) : (
          levels.map((level, index) => {
            const allocation = classAllocation(level)
            return (
              <Card key={index}>
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <div>
                      <Group gap="xs">
                        <Badge variant="light" size="lg">
                          Level
                        </Badge>
                        <Text fw={700} fz="lg">
                          {level.name}
                        </Text>
                        {level.code && (
                          <Badge variant="light" color="gray" size="sm">
                            {level.code}
                          </Badge>
                        )}
                      </Group>
                      <Text size="sm" mt={4}>
                        {level.ageGroup} · GHS {formatDraftAmount(level.defaultFee)} ·{' '}
                        {level.classesCount} classes —{' '}
                        <Text span size="sm" c="dimmed">
                          {level.description}
                        </Text>
                      </Text>
                    </div>
                    <Group gap="xs" wrap="nowrap">
                      <Tooltip label="Edit level">
                        <ActionIcon
                          variant="default"
                          aria-label="Edit"
                          onClick={() => openLevelForm(index)}
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Remove level">
                        <ActionIcon
                          variant="default"
                          aria-label="Remove"
                          onClick={() => remove(index)}
                        >
                          <IconTrash size={16} color="var(--mantine-color-red-7)" />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>

                  <Divider />

                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <Text fw={700}>Stages</Text>
                      <Badge variant="light" color="gray" size="sm">
                        {level.stages.length}
                      </Badge>
                      {level.stages.length > 0 && (
                        <Badge
                          variant="light"
                          color={allocation.balanced ? 'green' : 'red'}
                          size="sm"
                        >
                          {allocation.used}/{allocation.total} classes
                        </Badge>
                      )}
                      {level.stages.length > 0 && !allocation.balanced && (
                        <Text c="red" size="xs" fw={600}>
                          {allocation.remaining > 0
                            ? `${allocation.remaining} unassigned`
                            : `${Math.abs(allocation.remaining)} over`}
                        </Text>
                      )}
                    </Group>
                    <Button
                      type="button"
                      variant="default"
                      size="xs"
                      leftSection={<IconPlus size={14} />}
                      onClick={() => openStageForm({ levelIndex: index, stageIndex: null })}
                    >
                      Add stage
                    </Button>
                  </Group>

                  {level.stages.length > 0 && (
                    <StageTree
                      stages={level.stages}
                      onEditStage={(stageIndex) => openStageForm({ levelIndex: index, stageIndex })}
                      onRemoveStage={(stageIndex) => removeStage(index, stageIndex)}
                      onAddSkill={(stageIndex, skill) => addSkill(index, stageIndex, skill)}
                      onUpdateSkill={(stageIndex, skillIndex, skill) =>
                        updateSkill(index, stageIndex, skillIndex, skill)
                      }
                      onRemoveSkill={(stageIndex, skillIndex) =>
                        removeSkill(index, stageIndex, skillIndex)
                      }
                      onAddActivity={(stageIndex, skillIndex, activity) =>
                        addActivity(index, stageIndex, skillIndex, activity)
                      }
                      onUpdateActivity={(stageIndex, skillIndex, activityIndex, activity) =>
                        updateActivity(index, stageIndex, skillIndex, activityIndex, activity)
                      }
                      onRemoveActivity={(stageIndex, skillIndex, activityIndex) =>
                        removeActivity(index, stageIndex, skillIndex, activityIndex)
                      }
                    />
                  )}

                  {levelFormTarget === index && (
                    <LevelForm
                      key={index}
                      initial={level}
                      onCancel={closeLevelForm}
                      onSave={save}
                    />
                  )}

                  {stageTarget?.levelIndex === index && (
                    <StageBuilder
                      key={`${stageTarget.levelIndex}-${stageTarget.stageIndex ?? 'new'}`}
                      nextPosition={level.stages.length + 1}
                      initial={
                        stageTarget.stageIndex !== null
                          ? level.stages[stageTarget.stageIndex]
                          : undefined
                      }
                      onCancel={closeStageForm}
                      onSave={saveStage}
                    />
                  )}
                </Stack>
              </Card>
            )
          })
        )}

        {errors.levels && (
          <Text c="red" size="sm">
            {errors.levels}
          </Text>
        )}

        {levels.map((level, index) => (
          <Fragment key={index}>
            {level.id !== undefined && (
              <input type="hidden" name={`levels[${index}][id]`} value={level.id} />
            )}
            <input type="hidden" name={`levels[${index}][name]`} value={level.name} />
            <input type="hidden" name={`levels[${index}][ageGroup]`} value={level.ageGroup} />
            <input type="hidden" name={`levels[${index}][description]`} value={level.description} />
            <input type="hidden" name={`levels[${index}][defaultFee]`} value={level.defaultFee} />
            <input
              type="hidden"
              name={`levels[${index}][classesCount]`}
              value={level.classesCount}
            />
            <input type="hidden" name={`levels[${index}][audience]`} value={level.audience} />
            {level.stages.map((stage, stageIndex) => {
              const prefix = `levels[${index}][stages][${stageIndex}]`
              return (
                <Fragment key={stageIndex}>
                  {stage.id !== undefined && (
                    <input type="hidden" name={`${prefix}[id]`} value={stage.id} />
                  )}
                  <input type="hidden" name={`${prefix}[name]`} value={stage.name} />
                  <input type="hidden" name={`${prefix}[position]`} value={stage.position} />
                  <input
                    type="hidden"
                    name={`${prefix}[classesCount]`}
                    value={stage.classesCount}
                  />
                  {stage.description.trim() !== '' && (
                    <input
                      type="hidden"
                      name={`${prefix}[description]`}
                      value={stage.description}
                    />
                  )}
                  {stage.skills.map((skill, skillIndex) => {
                    const skillPrefix = `${prefix}[skills][${skillIndex}]`
                    return (
                      <Fragment key={skillIndex}>
                        {skill.id !== undefined && (
                          <input type="hidden" name={`${skillPrefix}[id]`} value={skill.id} />
                        )}
                        <input type="hidden" name={`${skillPrefix}[name]`} value={skill.name} />
                        <input
                          type="hidden"
                          name={`${skillPrefix}[passCriteria]`}
                          value={skill.passCriteria}
                        />
                        {skill.description.trim() !== '' && (
                          <input
                            type="hidden"
                            name={`${skillPrefix}[description]`}
                            value={skill.description}
                          />
                        )}
                        {skill.activities.map((activity, activityIndex) => (
                          <Fragment key={activityIndex}>
                            {activity.id !== undefined && (
                              <input
                                type="hidden"
                                name={`${skillPrefix}[activities][${activityIndex}][id]`}
                                value={activity.id}
                              />
                            )}
                            <input
                              type="hidden"
                              name={`${skillPrefix}[activities][${activityIndex}][name]`}
                              value={activity.name}
                            />
                            {activity.description.trim() !== '' && (
                              <input
                                type="hidden"
                                name={`${skillPrefix}[activities][${activityIndex}][description]`}
                                value={activity.description}
                              />
                            )}
                            {activity.applicationNotes.trim() !== '' && (
                              <input
                                type="hidden"
                                name={`${skillPrefix}[activities][${activityIndex}][applicationNotes]`}
                                value={activity.applicationNotes}
                              />
                            )}
                          </Fragment>
                        ))}
                      </Fragment>
                    )
                  })}
                </Fragment>
              )
            })}
          </Fragment>
        ))}
      </Stack>
    </>
  )
}
