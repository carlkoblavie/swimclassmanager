import { useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import { Button, Checkbox, Group, Stack, Textarea } from '@mantine/core'
import type { Data } from '@generated/data'
import LessonActivityBankBuilder from '~/components/lesson_activity_bank_builder'
import LessonStageSkills from '~/components/lesson_stage_skills'

type Lesson = Data.SwimmingClass['lessons'][number]

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
  const [conclude, setConclude] = useState(lesson.isConcluded)

  return (
    <Form route="class_lessons.update" routeParams={{ id: lesson.id }}>
      {({ processing }) => (
        <Stack gap="sm">
          <LessonStageSkills skills={skills} />
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
          <Textarea
            label="Lesson notes (optional)"
            name="notes"
            autosize
            minRows={2}
            defaultValue={lesson.notes ?? ''}
          />
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
