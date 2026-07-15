import { useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import { Button, Card, Group, MultiSelect, Stack, Text } from '@mantine/core'
import type { Data } from '@generated/data'

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
  skills,
  existingDates,
}: {
  classId: number
  weekday: number
  weekdayName: string
  skills: Data.SwimmingClass['skills']
  existingDates: string[]
}) {
  const latest = existingDates.toSorted().at(-1)
  const today = new Date()
  const anchor = latest && new Date(latest) > today ? new Date(latest) : today
  const nextDate = nextWeekdayDate(weekday, anchor)

  const [activityIds, setActivityIds] = useState<string[]>([])

  if (skills.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        This class has no skills yet — pick skills on the class before planning lessons.
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
            {skills.map((skill) => (
              <MultiSelect
                key={skill.id}
                label={`${skill.name} activities`}
                value={activityIds.filter((id) =>
                  skill.activities.some((activity) => String(activity.id) === id)
                )}
                onChange={(selected) => {
                  const others = activityIds.filter(
                    (id) => !skill.activities.some((activity) => String(activity.id) === id)
                  )
                  setActivityIds([...others, ...selected])
                }}
                data={skill.activities.map((activity) => ({
                  value: String(activity.id),
                  label: activity.name,
                }))}
              />
            ))}
            {activityIds.map((id, index) => (
              <input key={id} type="hidden" name={`activityIds[${index}]`} value={id} />
            ))}
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
