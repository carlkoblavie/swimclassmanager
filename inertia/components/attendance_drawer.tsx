import { router } from '@inertiajs/react'
import {
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { urlFor } from '~/client'

type Status = 'present' | 'late' | 'absent'

type RosterEntry = {
  learnerId: number
  name: string
  initials: string
  age: number
  guardian: string | null
  medicalInfo: string | null
  status: Status | null
}

type LessonInfo = {
  id: number
  date: string
  className: string
  levelName: string | null
  stageName: string | null
  startTime: string | null
  durationMinutes: number
  objectives: string[]
}

type AttendanceData = { lesson: LessonInfo; roster: RosterEntry[] }

const OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: 'present', label: 'P', color: 'teal' },
  { value: 'late', label: 'L', color: 'yellow' },
  { value: 'absent', label: 'A', color: 'red' },
]

export default function AttendanceDrawer({
  lessonId,
  opened,
  onClose,
}: {
  lessonId: number | null
  opened: boolean
  onClose: () => void
}) {
  const [data, setData] = useState<AttendanceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [marks, setMarks] = useState<Record<number, Status>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!lessonId || !opened) {
      return
    }
    setLoading(true)
    setData(null)
    fetch(urlFor('attendance.show', { id: lessonId }), {
      headers: { Accept: 'application/json' },
    })
      .then((res) => res.json())
      .then((json: AttendanceData) => {
        setData(json)
        const initial: Record<number, Status> = {}
        for (const entry of json.roster) {
          if (entry.status) {
            initial[entry.learnerId] = entry.status
          }
        }
        setMarks(initial)
      })
      .finally(() => setLoading(false))
  }, [lessonId, opened])

  const roster = data?.roster ?? []
  const counts = {
    present: Object.values(marks).filter((s) => s === 'present').length,
    late: Object.values(marks).filter((s) => s === 'late').length,
    absent: Object.values(marks).filter((s) => s === 'absent').length,
  }
  const unmarked = roster.length - Object.keys(marks).length

  const allPresent = () =>
    setMarks(Object.fromEntries(roster.map((entry) => [entry.learnerId, 'present' as Status])))
  const clearAll = () => setMarks({})

  const save = () => {
    if (!lessonId) {
      return
    }
    setSaving(true)
    router.post(
      urlFor('attendance.save', { id: lessonId }),
      {
        marks: roster
          .map((entry) => ({ learnerId: entry.learnerId, status: marks[entry.learnerId] }))
          .filter((m) => m.status),
      },
      { onSuccess: onClose, onFinish: () => setSaving(false), preserveScroll: true }
    )
  }

  return (
    <Drawer opened={opened} onClose={onClose} position="right" size={560} title={null} padding={0}>
      {loading || !data ? (
        <Group justify="center" p="xl">
          <Loader />
        </Group>
      ) : (
        <Stack gap={0} mih="100%">
          <Box p="lg">
            <Text size="xs" tt="uppercase" c="dimmed" fw={800} lts="0.14em">
              Attendance
            </Text>
            <Title order={2} mt={4}>
              {data.lesson.className}
            </Title>
            <Text c="dimmed" mt={2}>
              {[data.lesson.levelName, data.lesson.stageName].filter(Boolean).join(' · ')} ·{' '}
              {data.lesson.date}
            </Text>
            <Text c="dimmed" size="sm" mt={2}>
              {data.lesson.startTime ?? 'Time not set'} · {data.lesson.durationMinutes} min
            </Text>
            {data.lesson.objectives.length > 0 && (
              <Text size="sm" mt="xs">
                <Text span fw={700}>
                  Objectives:{' '}
                </Text>
                {data.lesson.objectives.join(', ')}
              </Text>
            )}
          </Box>
          <Divider />

          <Group justify="space-between" p="md" px="lg">
            <Group gap="sm">
              <Button
                variant="light"
                color="teal"
                size="xs"
                leftSection={<IconCheck size={14} />}
                onClick={allPresent}
              >
                All present
              </Button>
              <Button variant="default" size="xs" onClick={clearAll}>
                Clear
              </Button>
            </Group>
            <Group gap="md">
              <Text size="xs" c="teal.7" fw={600}>
                {counts.present} present
              </Text>
              <Text size="xs" c="yellow.7" fw={600}>
                {counts.late} late
              </Text>
              <Text size="xs" c="red.6" fw={600}>
                {counts.absent} absent
              </Text>
            </Group>
          </Group>
          <Divider />

          <Stack gap={0} style={{ flex: 1, overflowY: 'auto' }}>
            {roster.length === 0 ? (
              <Text c="dimmed" p="lg">
                No learners are signed up for this lesson.
              </Text>
            ) : (
              roster.map((entry) => (
                <Group
                  key={entry.learnerId}
                  justify="space-between"
                  wrap="nowrap"
                  p="sm"
                  px="lg"
                  style={{ borderBottom: '1px solid var(--mantine-color-gray-1)' }}
                >
                  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                    <Avatar radius="xl" color="gray" size="md">
                      {entry.initials}
                    </Avatar>
                    <Box style={{ minWidth: 0 }}>
                      <Text fw={700} truncate>
                        {entry.name}
                      </Text>
                      {entry.medicalInfo ? (
                        <Text size="sm" c="red.7" truncate>
                          {entry.medicalInfo}
                        </Text>
                      ) : (
                        <Text size="sm" c="dimmed" truncate>
                          Age {entry.age}
                          {entry.guardian ? ` · ${entry.guardian}` : ''}
                        </Text>
                      )}
                    </Box>
                  </Group>
                  <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                    {OPTIONS.map((option) => {
                      const active = marks[entry.learnerId] === option.value
                      return (
                        <Button
                          key={option.value}
                          variant={active ? 'filled' : 'light'}
                          color={active ? option.color : 'gray'}
                          size="compact-md"
                          w={48}
                          onClick={() =>
                            setMarks((current) => ({ ...current, [entry.learnerId]: option.value }))
                          }
                        >
                          {option.label}
                        </Button>
                      )
                    })}
                  </Group>
                </Group>
              ))
            )}
          </Stack>

          <Group
            justify="space-between"
            p="lg"
            style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
          >
            <Text size="sm" c={unmarked > 0 ? 'yellow.8' : 'teal.7'} fw={700}>
              {unmarked > 0
                ? `${unmarked} ${unmarked === 1 ? 'learner' : 'learners'} unmarked`
                : 'Everyone marked'}
            </Text>
            <Button loading={saving} onClick={save} disabled={roster.length === 0}>
              Save attendance
            </Button>
          </Group>
        </Stack>
      )}
    </Drawer>
  )
}
