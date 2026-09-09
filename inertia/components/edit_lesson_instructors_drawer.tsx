import { useEffect, useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import type { Data } from '@generated/data'

type Lesson = Data.SwimmingClass['lessons'][number]

/**
 * Edit a single lesson's plan: its objectives (from the class goals) and the
 * skills it covers. Date, start time, and duration are shown read-only —
 * instructors are staffed at the stage, not the lesson.
 */
export default function EditLessonInstructorsDrawer({
  lesson,
  lessonNumber,
  className,
  classAssessmentGoals,
  classSkills,
  classStartTimeFormatted,
  opened,
  onClose,
  onSaved,
}: {
  lesson: Lesson | null
  lessonNumber: number
  className: string
  classAssessmentGoals: string[]
  classSkills: Data.SwimmingClass['skills']
  classStartTimeFormatted: string | null
  opened: boolean
  onClose: () => void
  onSaved?: (lessonId: number) => void
}) {
  const [objectives, setObjectives] = useState<string[]>([])
  const [skillIds, setSkillIds] = useState<number[]>([])

  useEffect(() => {
    if (!lesson) {
      setObjectives([])
      setSkillIds([])
      return
    }

    const savedGoals = (lesson.objectives ?? '')
      .split('\n')
      .map((goal) => goal.trim())
      .filter(Boolean)
    setObjectives(savedGoals.filter((goal) => classAssessmentGoals.includes(goal)))

    const savedSkillIds = lesson.skillIds ?? []
    setSkillIds(savedSkillIds.length > 0 ? savedSkillIds : classSkills.map((skill) => skill.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id])

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={520}
      padding={0}
      withCloseButton={false}
      title={null}
    >
      {lesson && (
        <Form
          route="class_lessons.update_plan"
          routeParams={{ id: lesson.id }}
          onSuccess={() => (onSaved ? onSaved(lesson.id) : onClose())}
        >
          {({ processing }) => (
            <Stack gap={0} mih="100%">
              <Group justify="space-between" align="flex-start" p="lg">
                <Box>
                  <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.14em">
                    Edit lesson {String(lessonNumber).padStart(2, '0')}
                  </Text>
                  <Title order={2} mt={4}>
                    {lesson.date.formatted}
                  </Title>
                  <Text c="dimmed" mt={2}>
                    {className}
                  </Text>
                </Box>
                <ActionIcon variant="subtle" color="gray" aria-label="Close" onClick={onClose}>
                  <IconX size={20} />
                </ActionIcon>
              </Group>

              <Divider />

              <Stack gap="lg" p="lg" style={{ flex: 1 }}>
                <Box>
                  <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.14em">
                    Schedule
                  </Text>
                  <SimpleGrid cols={{ base: 1, sm: 3 }} mt="xs">
                    <Box>
                      <Text size="sm" fw={500}>
                        Date
                      </Text>
                      <Text mt={8}>{lesson.date.formatted}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" fw={500}>
                        Start time
                      </Text>
                      <Text mt={8}>
                        {lesson.startTime?.formatted ?? classStartTimeFormatted ?? 'Not set'}
                      </Text>
                    </Box>
                    <Box>
                      <Text size="sm" fw={500}>
                        Duration
                      </Text>
                      <Text mt={8}>{lesson.durationMinutes} min</Text>
                    </Box>
                  </SimpleGrid>
                </Box>

                <Box>
                  <Group justify="space-between" align="baseline">
                    <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.14em">
                      Objectives
                    </Text>
                    <Text size="sm" c={objectives.length === 0 ? 'red' : 'dimmed'}>
                      {objectives.length || 'pick at least one'}
                    </Text>
                  </Group>
                  <Text size="sm" c="dimmed" mt={4}>
                    Choose the class goals this lesson works toward.
                  </Text>
                  <Stack gap="xs" mt="xs">
                    {classAssessmentGoals.length === 0 ? (
                      <Text size="sm" c="dimmed">
                        This class has no assessment goals yet.
                      </Text>
                    ) : (
                      classAssessmentGoals.map((goal) => {
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
                                  checked
                                    ? current.filter((item) => item !== goal)
                                    : [...current, goal]
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

                <Box>
                  <Group justify="space-between" align="baseline">
                    <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.14em">
                      Skills
                    </Text>
                    <Text size="sm" c={skillIds.length === 0 ? 'red' : 'dimmed'}>
                      {skillIds.length || 'pick at least one'}
                    </Text>
                  </Group>
                  <Text size="sm" c="dimmed" mt={4}>
                    Choose the class skills this lesson covers.
                  </Text>
                  <Stack gap="xs" mt="xs">
                    {classSkills.length === 0 ? (
                      <Text size="sm" c="dimmed">
                        This class has no skills yet.
                      </Text>
                    ) : (
                      classSkills.map((skill) => {
                        const checked = skillIds.includes(skill.id)
                        return (
                          <Box
                            key={skill.id}
                            p="sm"
                            style={{
                              border: '1px solid var(--mantine-color-gray-3)',
                              borderRadius: 10,
                            }}
                          >
                            <Checkbox
                              checked={checked}
                              onChange={() =>
                                setSkillIds((current) =>
                                  checked
                                    ? current.filter((id) => id !== skill.id)
                                    : [...current, skill.id]
                                )
                              }
                              label={<Text>{skill.name}</Text>}
                            />
                          </Box>
                        )
                      })
                    )}
                  </Stack>
                </Box>
              </Stack>

              {objectives.map((goal, index) => (
                <input key={goal} type="hidden" name={`objectives[${index}]`} value={goal} />
              ))}
              {skillIds.map((id, index) => (
                <input key={id} type="hidden" name={`skillIds[${index}]`} value={id} />
              ))}

              <Box p="lg" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                <Group justify="flex-end">
                  <Button type="button" variant="default" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={processing}
                    disabled={objectives.length === 0 || skillIds.length === 0}
                  >
                    Save changes
                  </Button>
                </Group>
              </Box>
            </Stack>
          )}
        </Form>
      )}
    </Drawer>
  )
}
