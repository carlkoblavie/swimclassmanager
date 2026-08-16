import { Form } from '@adonisjs/inertia/react'
import { Button, Group, Stack } from '@mantine/core'
import type { Data } from '@generated/data'
import LessonActivityBankBuilder from '~/components/lesson_activity_bank_builder'

type Lesson = Data.SwimmingClass['lessons'][number]

export default function EditLessonActivitiesForm({
  lesson,
  activityBank,
  durationMinutes,
  onCancel,
}: {
  lesson: Lesson
  activityBank: Data.SchoolActivityCategory[]
  durationMinutes: number
  onCancel: () => void
}) {
  return (
    <Form route="class_lessons.activities_update" routeParams={{ id: lesson.id }}>
      {({ processing }) => (
        <Stack gap="sm">
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
          <Group justify="flex-end" gap="sm">
            <Button type="button" size="xs" variant="default" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" size="xs" loading={processing}>
              Save activities
            </Button>
          </Group>
        </Stack>
      )}
    </Form>
  )
}
