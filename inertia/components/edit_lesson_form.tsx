import { useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import { Button, Group, MultiSelect, Stack, Textarea } from '@mantine/core'
import type { Data } from '@generated/data'

type Lesson = Data.SwimmingClass['lessons'][number]

export default function EditLessonForm({
  lesson,
  skills,
  onCancel,
}: {
  lesson: Lesson
  skills: Data.SwimmingClass['skills']
  onCancel: () => void
}) {
  const [activityIds, setActivityIds] = useState<string[]>(
    lesson.activities.map((activity) => String(activity.id))
  )

  return (
    <Form route="class_lessons.update" routeParams={{ id: lesson.id }}>
      {({ processing }) => (
        <Stack gap="sm">
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
          <Textarea
            label="Lesson notes (optional)"
            name="notes"
            autosize
            minRows={2}
            defaultValue={lesson.notes ?? ''}
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
