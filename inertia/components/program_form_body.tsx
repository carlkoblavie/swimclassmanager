import { Fragment, useState } from 'react'
import { useDisclosure } from '@mantine/hooks'
import {
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconFileDescription, IconStack2 } from '@tabler/icons-react'
import LevelModal, { type LevelDraft } from '~/components/level_modal'
import StageBuilder, { type StageDraft } from '~/components/stage_builder'

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

export default function ProgramFormBody({ errors, initial }: Props) {
  const [levels, setLevels] = useState<LevelDraft[]>(initial?.levels ?? [])
  const [opened, { open, close }] = useDisclosure(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const openAdd = () => {
    setEditingIndex(null)
    open()
  }
  const openEdit = (index: number) => {
    setEditingIndex(index)
    open()
  }
  const remove = (index: number) => setLevels((current) => current.filter((_, i) => i !== index))
  const save = (draft: LevelDraft) =>
    setLevels((current) =>
      editingIndex === null
        ? [...current, draft]
        : current.map((level, i) => (i === editingIndex ? draft : level))
    )

  const [stageTarget, setStageTarget] = useState<StageTarget | null>(null)
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
          <Button variant="light" size="sm" onClick={openAdd}>
            Add level
          </Button>
        </Group>

        {levels.length === 0 ? (
          <Card>
            <Text c="dimmed" size="sm">
              No levels added yet. Add at least one.
            </Text>
          </Card>
        ) : (
          levels.map((level, index) => (
            <Card key={index}>
              <Group justify="space-between" align="flex-start">
                <Stack gap={4}>
                  <Group gap="xs">
                    <Badge variant="light" size="sm">
                      Level
                    </Badge>
                    <Text fw={600}>{level.name}</Text>
                  </Group>
                  <Text size="sm">
                    {level.ageGroup} · Capacity {level.capacity} · GHS {level.defaultFee}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {level.description}
                  </Text>
                  {level.stages.length > 0 && (
                    <Stack gap={4} mt={4}>
                      {[...level.stages]
                        .map((stage, stageIndex) => ({ stage, stageIndex }))
                        .sort((a, b) => Number(a.stage.position) - Number(b.stage.position))
                        .map(({ stage, stageIndex }) => (
                          <Group key={stageIndex} gap="xs">
                            <Badge variant="light" color="gray" size="sm">
                              {stage.position}
                            </Badge>
                            <Text size="sm" fw={500}>
                              {stage.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {stage.skills.length} skills · {stage.activities.length} activities
                            </Text>
                            <Anchor
                              component="button"
                              type="button"
                              size="sm"
                              onClick={() => setStageTarget({ levelIndex: index, stageIndex })}
                            >
                              Edit stage
                            </Anchor>
                            <Anchor
                              component="button"
                              type="button"
                              size="sm"
                              c="red"
                              onClick={() => removeStage(index, stageIndex)}
                            >
                              Remove stage
                            </Anchor>
                          </Group>
                        ))}
                    </Stack>
                  )}
                  <div>
                    <Button
                      variant="subtle"
                      size="xs"
                      px={0}
                      onClick={() => setStageTarget({ levelIndex: index, stageIndex: null })}
                    >
                      Add stage
                    </Button>
                  </div>
                  {stageTarget?.levelIndex === index && (
                    <StageBuilder
                      key={`${stageTarget.levelIndex}-${stageTarget.stageIndex ?? 'new'}`}
                      nextPosition={level.stages.length + 1}
                      initial={
                        stageTarget.stageIndex !== null
                          ? level.stages[stageTarget.stageIndex]
                          : undefined
                      }
                      onCancel={() => setStageTarget(null)}
                      onSave={saveStage}
                    />
                  )}
                </Stack>
                <Group gap="md">
                  <Anchor
                    component="button"
                    type="button"
                    size="sm"
                    onClick={() => openEdit(index)}
                  >
                    Edit
                  </Anchor>
                  <Anchor
                    component="button"
                    type="button"
                    size="sm"
                    c="red"
                    onClick={() => remove(index)}
                  >
                    Remove
                  </Anchor>
                </Group>
              </Group>
            </Card>
          ))
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
            <input type="hidden" name={`levels[${index}][capacity]`} value={level.capacity} />
            {level.stages.map((stage, stageIndex) => {
              const prefix = `levels[${index}][stages][${stageIndex}]`
              return (
                <Fragment key={stageIndex}>
                  <input type="hidden" name={`${prefix}[name]`} value={stage.name} />
                  <input type="hidden" name={`${prefix}[position]`} value={stage.position} />
                  {stage.description.trim() !== '' && (
                    <input type="hidden" name={`${prefix}[description]`} value={stage.description} />
                  )}
                  {stage.skills.map((skill, skillIndex) => (
                    <Fragment key={skillIndex}>
                      <input
                        type="hidden"
                        name={`${prefix}[skills][${skillIndex}][name]`}
                        value={skill.name}
                      />
                      <input
                        type="hidden"
                        name={`${prefix}[skills][${skillIndex}][passCriteria]`}
                        value={skill.passCriteria}
                      />
                    </Fragment>
                  ))}
                  {stage.activities.map((activity, activityIndex) => (
                    <Fragment key={activityIndex}>
                      <input
                        type="hidden"
                        name={`${prefix}[activities][${activityIndex}][name]`}
                        value={activity.name}
                      />
                      <input
                        type="hidden"
                        name={`${prefix}[activities][${activityIndex}][durationMinutes]`}
                        value={activity.durationMinutes}
                      />
                    </Fragment>
                  ))}
                </Fragment>
              )
            })}
          </Fragment>
        ))}
      </Stack>

      <LevelModal
        opened={opened}
        onClose={close}
        onSave={save}
        initial={editingIndex !== null ? levels[editingIndex] : undefined}
      />
    </>
  )
}
