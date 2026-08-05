import { useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import { Button, Card, Group, Stack, Text, Textarea } from '@mantine/core'
import type { Data } from '@generated/data'
import LessonActivityBankBuilder from '~/components/lesson_activity_bank_builder'
import LessonStageSkills from '~/components/lesson_stage_skills'

/** The next date falling on `weekday` (1=Monday) strictly after `after`. */
export function nextWeekdayDate(weekday: number, after: Date): string {
  const date = new Date(after)
  date.setDate(date.getDate() + 1)
  while (date.getDay() !== weekday % 7) {
    date.setDate(date.getDate() + 1)
  }
  return date.toISOString().slice(0, 10)
}

export default function PlanLessonForm({
  classId,
  weekday,
  weekdayName,
  existingDates,
  skills,
  activityBank,
  durationMinutes,
}: {
  classId: number
  weekday: number
  weekdayName: string
  existingDates: string[]
  skills: Data.SwimmingClass['skills']
  activityBank: Data.SchoolActivityCategory[]
  durationMinutes: number
}) {
  const latest = existingDates.toSorted().at(-1)
  const today = new Date()
  const anchor = latest && new Date(latest) > today ? new Date(latest) : today
  const nextDate = nextWeekdayDate(weekday, anchor)

  const [objectives, setObjectives] = useState('')

  if (activityBank.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        This school has no activity bank yet.
      </Text>
    )
  }

  return (
    <Card bg="gray.0" shadow="none" padding="md">
      <Form route="class_lessons.store" routeParams={{ id: classId }}>
        {({ processing }) => (
          <Stack gap="sm">
            <div>
              <Text fw={600} size="sm">
                Plan the next lesson
              </Text>
              <Text size="xs" c="dimmed">
                Lessons follow the class day: next up is {weekdayName} {nextDate}.
              </Text>
            </div>
            <LessonStageSkills skills={skills} />
            <Textarea
              label="Lesson objectives"
              name="objectives"
              autosize
              minRows={2}
              value={objectives}
              onChange={(event) => setObjectives(event.currentTarget.value)}
              required
            />
            <LessonActivityBankBuilder
              activityBank={activityBank}
              durationMinutes={durationMinutes}
            />
            <Textarea
              label="Lesson notes (optional)"
              name="notes"
              autosize
              minRows={2}
              placeholder="Focus points, reminders, or anything the instructor should know…"
            />
            <Group justify="flex-end">
              <Button type="submit" size="sm" loading={processing}>
                Plan next lesson
              </Button>
            </Group>
          </Stack>
        )}
      </Form>
    </Card>
  )
}
