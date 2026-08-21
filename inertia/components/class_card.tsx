import { Box, Button, Card, Divider, Group, Stack, Text } from '@mantine/core'
import { Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import { urlFor } from '~/client'
import ClassDetails from '~/components/class_details'

export default function ClassCard({
  swimmingClass,
  showLessons = false,
}: {
  swimmingClass: Data.SwimmingClass
  showLessons?: boolean
}) {
  return (
    <Card
      withBorder
      shadow="none"
      radius="md"
      padding={0}
      style={{ alignSelf: 'start', overflow: 'hidden' }}
    >
      <Box p="md">
        <ClassDetails
          swimmingClass={swimmingClass}
          rightAction={
            <Button
              component={Link}
              href={urlFor('lessons.index', [], { qs: { classId: swimmingClass.id } })}
              size="xs"
              variant="subtle"
            >
              View
            </Button>
          }
        />
      </Box>

      {showLessons && swimmingClass.lessons.length > 0 && (
        <>
          <Divider my="sm" />
          <Stack gap={4} p="md">
            <Text size="xs" tt="uppercase" c="dimmed" fw={700}>
              Lessons
            </Text>
            {swimmingClass.lessons.map((lesson) => (
              <Group key={lesson.id} gap="xs" wrap="nowrap" align="baseline">
                <Text size="sm" w={170} style={{ flexShrink: 0 }}>
                  {lesson.date.formatted}
                </Text>
                <Text size="sm" c="dimmed">
                  {lesson.activities.length > 0
                    ? lesson.activities.map((activity) => activity.name).join(', ')
                    : 'No activities planned'}
                </Text>
              </Group>
            ))}
          </Stack>
        </>
      )}
    </Card>
  )
}
