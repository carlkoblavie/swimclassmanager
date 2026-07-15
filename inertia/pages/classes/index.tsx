import { useState } from 'react'
import { Button, Container, Group, NativeSelect, Stack, Text, Title } from '@mantine/core'
import { Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import { Guard } from '~/utils/permissions'
import ClassCard from '~/components/class_card'
import ClassesEmptyState from '~/components/classes_empty_state'

type PageProps = InertiaProps<{
  classes: Data.SwimmingClass[]
}>

const ALL = 'all'

export default function ClassesIndex({ classes }: PageProps) {
  const [programFilter, setProgramFilter] = useState(ALL)
  const [levelFilter, setLevelFilter] = useState(ALL)

  const programNames = [...new Set(classes.map((c) => c.level?.programName ?? ''))].filter(
    (name) => name !== ''
  )
  const levelNames = [
    ...new Set(
      classes
        .filter((c) => programFilter === ALL || c.level?.programName === programFilter)
        .map((c) => c.level?.name ?? '')
    ),
  ].filter((name) => name !== '')

  const visible = classes.filter(
    (c) =>
      (programFilter === ALL || c.level?.programName === programFilter) &&
      (levelFilter === ALL || c.level?.name === levelFilter)
  )

  // Group per program, then per level, preserving schedule order within.
  const grouped = new Map<string, Map<string, Data.SwimmingClass[]>>()
  for (const swimmingClass of visible) {
    const program = swimmingClass.level?.programName ?? 'Other'
    const level = swimmingClass.level?.name ?? 'Other'
    if (!grouped.has(program)) {
      grouped.set(program, new Map())
    }
    const levels = grouped.get(program)!
    if (!levels.has(level)) {
      levels.set(level, [])
    }
    levels.get(level)!.push(swimmingClass)
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1}>Classes</Title>
            <Text c="dimmed" size="sm">
              Weekly classes, grouped by program and level.
            </Text>
          </div>
          <Guard for="class.manage">
            <Button component={Link} route="programs.index" variant="light">
              Create classes from a program
            </Button>
          </Guard>
        </Group>

        {classes.length === 0 ? (
          <ClassesEmptyState />
        ) : (
          <>
            <Group gap="sm">
              <NativeSelect
                label="Filter by program"
                value={programFilter}
                onChange={(event) => {
                  setProgramFilter(event.currentTarget.value)
                  setLevelFilter(ALL)
                }}
                data={[
                  { value: ALL, label: 'All programs' },
                  ...programNames.map((name) => ({ value: name, label: name })),
                ]}
              />
              <NativeSelect
                label="Filter by level"
                value={levelFilter}
                onChange={(event) => setLevelFilter(event.currentTarget.value)}
                data={[
                  { value: ALL, label: 'All levels' },
                  ...levelNames.map((name) => ({ value: name, label: name })),
                ]}
              />
            </Group>

            {visible.length === 0 ? (
              <Text c="dimmed" size="sm">
                No classes match the selected filters.
              </Text>
            ) : (
              [...grouped.entries()].map(([programName, levels]) => (
                <Stack key={programName} gap="sm">
                  <Title order={3} fz="lg">
                    {programName}
                  </Title>
                  {[...levels.entries()].map(([levelName, levelClasses]) => (
                    <Stack key={levelName} gap="sm">
                      <Text size="xs" tt="uppercase" c="dimmed" fw={700}>
                        {levelName}
                      </Text>
                      {levelClasses.map((swimmingClass) => (
                        <ClassCard key={swimmingClass.id} swimmingClass={swimmingClass} />
                      ))}
                    </Stack>
                  ))}
                </Stack>
              ))
            )}
          </>
        )}
      </Stack>
    </Container>
  )
}
