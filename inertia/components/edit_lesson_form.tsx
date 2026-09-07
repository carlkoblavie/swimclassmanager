import { useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  Stack,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { IconPlus, IconX } from '@tabler/icons-react'
import type { Data } from '@generated/data'
import LessonActivityBankBuilder from '~/components/lesson_activity_bank_builder'
import LessonStageSkills from '~/components/lesson_stage_skills'

type Lesson = Data.SwimmingClass['lessons'][number]

function isPastLesson(rawDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const lessonDate = new Date(`${rawDate}T00:00:00`)
  return lessonDate < today
}

export default function EditLessonForm({
  lesson,
  skills,
  activityBank,
  durationMinutes,
  assessmentGoals,
  onCancel,
}: {
  lesson: Lesson
  skills: Data.SwimmingClass['skills']
  activityBank: Data.SchoolActivityCategory[]
  durationMinutes: number
  assessmentGoals: string[]
  onCancel: () => void
}) {
  const canConclude = isPastLesson(lesson.date.raw)
  const [conclude, setConclude] = useState(lesson.isConcluded)
  const [equipment, setEquipment] = useState<string[]>(lesson.equipment ?? [])
  const [equipmentDraft, setEquipmentDraft] = useState('')
  const [objectives, setObjectives] = useState<string[]>(() => {
    const saved = (lesson.objectives ?? '')
      .split('\n')
      .map((goal) => goal.trim())
      .filter(Boolean)
    return saved.filter((goal) => assessmentGoals.includes(goal))
  })

  const addEquipment = () => {
    const nextItem = equipmentDraft.trim()
    if (!nextItem || equipment.includes(nextItem)) {
      setEquipmentDraft('')
      return
    }

    setEquipment((current) => [...current, nextItem])
    setEquipmentDraft('')
  }

  return (
    <Form route="class_lessons.update" routeParams={{ id: lesson.id }}>
      {({ processing }) => (
        <Stack gap="sm">
          <LessonStageSkills skills={skills} variant="tiles" />
          <Box>
            <Group justify="space-between" align="baseline">
              <Text size="sm" fw={500}>
                Lesson objectives
              </Text>
              <Text size="xs" c={objectives.length === 0 ? 'red' : 'dimmed'}>
                {objectives.length || 'pick at least one'}
              </Text>
            </Group>
            <Text size="xs" c="dimmed" mb="xs">
              Choose the class goals this lesson works toward.
            </Text>
            {objectives.map((goal, index) => (
              <input key={goal} type="hidden" name={`objectives[${index}]`} value={goal} />
            ))}
            <Stack gap="xs">
              {assessmentGoals.length === 0 ? (
                <Text size="sm" c="dimmed">
                  This class has no assessment goals yet.
                </Text>
              ) : (
                assessmentGoals.map((goal) => {
                  const checked = objectives.includes(goal)
                  return (
                    <Box
                      key={goal}
                      p="sm"
                      style={{
                        border: '1px solid var(--mantine-color-gray-3)',
                        borderRadius: 10,
                      }}
                    >
                      <Checkbox
                        checked={checked}
                        onChange={() =>
                          setObjectives((current) =>
                            checked ? current.filter((item) => item !== goal) : [...current, goal]
                          )
                        }
                        label={<Text>{goal}</Text>}
                      />
                    </Box>
                  )
                })
              )}
            </Stack>
          </Box>
          <LessonActivityBankBuilder
            activityBank={activityBank}
            durationMinutes={durationMinutes}
            initialActivities={lesson.activities.flatMap((activity) =>
              activity.schoolActivityId
                ? [
                    {
                      schoolActivityId: activity.schoolActivityId,
                      durationMinutes: activity.durationMinutes,
                      ledBy: activity.ledBy,
                    },
                  ]
                : []
            )}
          />
          <Stack gap={6}>
            <Text size="sm" fw={500}>
              Equipment
            </Text>
            {equipment.map((item, index) => (
              <input
                key={`${item}-${index}`}
                type="hidden"
                name={`equipment[${index}]`}
                value={item}
              />
            ))}
            <Group gap="xs" align="flex-end">
              <TextInput
                aria-label="Equipment item"
                placeholder="Kickboards x6"
                value={equipmentDraft}
                onChange={(event) => setEquipmentDraft(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addEquipment()
                  }
                }}
                style={{ flex: 1 }}
              />
              <Button
                type="button"
                variant="default"
                leftSection={<IconPlus size={16} />}
                onClick={addEquipment}
              >
                Add equipment
              </Button>
            </Group>
            {equipment.length > 0 && (
              <Group gap="xs">
                {equipment.map((item) => (
                  <Badge
                    key={item}
                    variant="light"
                    color="gray"
                    radius="xl"
                    rightSection={
                      <Tooltip label={`Remove ${item}`}>
                        <ActionIcon
                          aria-label={`Remove ${item}`}
                          size="xs"
                          variant="subtle"
                          color="gray"
                          onClick={() =>
                            setEquipment((current) =>
                              current.filter((candidate) => candidate !== item)
                            )
                          }
                        >
                          <IconX size={10} />
                        </ActionIcon>
                      </Tooltip>
                    }
                  >
                    {item}
                  </Badge>
                ))}
              </Group>
            )}
          </Stack>
          <Textarea
            label="Lesson notes (optional)"
            name="notes"
            autosize
            minRows={2}
            defaultValue={lesson.notes ?? ''}
          />
          {canConclude && (
            <>
              <Checkbox
                label="Conclude this lesson"
                checked={conclude}
                onChange={(event) => setConclude(event.currentTarget.checked)}
              />
              {conclude && <input type="hidden" name="intent" value="conclude" />}
              <Textarea
                label="Lesson observation"
                name="observation"
                autosize
                minRows={3}
                defaultValue={lesson.observation ?? ''}
                required={conclude}
              />
            </>
          )}
          <Group justify="flex-end" gap="sm">
            <Button type="button" size="xs" variant="default" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" size="xs" loading={processing}>
              Save lesson
            </Button>
          </Group>
        </Stack>
      )}
    </Form>
  )
}
