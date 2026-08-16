import { useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import {
  ActionIcon,
  Badge,
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
  onCancel,
}: {
  lesson: Lesson
  skills: Data.SwimmingClass['skills']
  activityBank: Data.SchoolActivityCategory[]
  durationMinutes: number
  onCancel: () => void
}) {
  const canConclude = isPastLesson(lesson.date.raw)
  const [conclude, setConclude] = useState(lesson.isConcluded)
  const [equipment, setEquipment] = useState<string[]>(lesson.equipment ?? [])
  const [equipmentDraft, setEquipmentDraft] = useState('')

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
          <Textarea
            label="Lesson objectives"
            name="objectives"
            autosize
            minRows={2}
            defaultValue={lesson.objectives ?? ''}
            required
          />
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
