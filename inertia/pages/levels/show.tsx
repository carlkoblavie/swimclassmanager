import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import { urlFor } from '~/client'
import { Guard } from '~/utils/permissions'
import ClassCard from '~/components/class_card'
import MetaStrip from '~/components/meta_strip'

type PageProps = InertiaProps<{
  level: Data.Level.Variants['forClassOption']
  classes: Data.SwimmingClass[]
}>

const SKILL_DOT_COLORS = [
  'var(--mantine-color-aqua-6)',
  'var(--mantine-color-violet-5)',
  'var(--mantine-color-teal-6)',
  'var(--mantine-color-orange-5)',
]

export default function LevelsShow({ level, classes }: PageProps) {
  const skillCount = level.stages.reduce((total, stage) => total + stage.skills.length, 0)

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Anchor component={Link} href={urlFor('programs.show', { id: level.programId })} size="sm">
          ← {level.programName || 'Program'}
        </Anchor>

        {/* Level hero */}
        <Card padding={0}>
          <Group justify="space-between" align="flex-start" p="lg" wrap="wrap">
            <Group gap="md" align="flex-start" wrap="nowrap">
              <Box
                bg="aqua.0"
                c="aqua.8"
                w={52}
                h={52}
                style={{
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Text fw={800} fz="md">
                  {level.ageGroup}
                </Text>
              </Box>
              <div>
                <Group gap="xs">
                  <Title order={1} fz="h2">
                    {level.name}
                  </Title>
                  <Badge variant="light" color="gray" size="sm">
                    {level.code}
                  </Badge>
                  {level.available ? (
                    <Badge variant="light" color="green" size="sm">
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="light" color="red" size="sm">
                      Unavailable
                    </Badge>
                  )}
                </Group>
                <Text size="sm" c="dimmed" mt={4} maw="60ch">
                  {level.description}
                </Text>
              </div>
            </Group>
            <Guard for="program.manage">
              <Button
                component={Link}
                href={urlFor('programs.edit', { id: level.programId })}
                variant="default"
              >
                Edit curriculum
              </Button>
            </Guard>
          </Group>
          <Divider />
          <MetaStrip
            items={[
              { label: 'Age range', value: level.ageGroup },
              { label: 'Audience', value: level.audience === 'adult' ? 'Adults' : 'Children' },
              {
                label: 'Capacity',
                value: typeof level.capacity === 'number' ? `${level.capacity} learners` : '—',
              },
              { label: 'Your fee', value: level.fee.formatted },
              {
                label: 'Classes to complete',
                value: typeof level.classesCount === 'number' ? level.classesCount : '—',
              },
              { label: 'Stages', value: level.stages.length },
              { label: 'Skills', value: skillCount },
            ]}
          />
        </Card>

        {/* Curriculum: skill cards grouped per stage */}
        <Group justify="space-between" align="center">
          <Title order={2} fz="lg">
            Skills
          </Title>
          <Text size="sm" c="dimmed">
            {skillCount} {skillCount === 1 ? 'skill' : 'skills'}
          </Text>
        </Group>

        {level.stages.length === 0 ? (
          <Text size="sm" c="dimmed">
            No stages yet.
          </Text>
        ) : (
          level.stages.map((stage) => (
            <Stack key={stage.id} gap="sm">
              <Group gap="sm">
                <ThemeIcon variant="light" radius="xl" size="md">
                  <Text size="xs" fw={700}>
                    {stage.position}
                  </Text>
                </ThemeIcon>
                <Box style={{ minWidth: 0, flex: 1 }}>
                  <Text fw={700}>{stage.name}</Text>
                  {stage.description && (
                    <Text size="sm" c="dimmed">
                      {stage.description}
                    </Text>
                  )}
                </Box>
                <Badge variant="light" color="gray" size="sm">
                  {stage.code}
                </Badge>
                {typeof stage.classesCount === 'number' && (
                  <Badge variant="light" color="blue" size="sm">
                    {stage.classesCount} classes
                  </Badge>
                )}
              </Group>

              {stage.skills.length === 0 ? (
                <Text size="sm" c="dimmed" pl={40}>
                  No skills in this stage yet.
                </Text>
              ) : (
                stage.skills.map((skill, skillIndex) => (
                  <Card key={skill.id} padding={0}>
                    <Stack gap={4} p="lg" pb="md">
                      <Group gap="sm" wrap="wrap">
                        <Box
                          w={10}
                          h={10}
                          style={{
                            borderRadius: '50%',
                            background: SKILL_DOT_COLORS[skillIndex % SKILL_DOT_COLORS.length],
                            flexShrink: 0,
                          }}
                        />
                        <Text fw={800} c="aqua.8">
                          {skill.name}
                        </Text>
                        <Badge variant="light" size="sm" ml="auto">
                          Pass: {skill.passCriteria}
                        </Badge>
                      </Group>
                      {skill.description && (
                        <Text size="sm" c="dimmed" pl={22}>
                          {skill.description}
                        </Text>
                      )}
                    </Stack>
                  </Card>
                ))
              )}
            </Stack>
          ))
        )}

        {/* Classes running this level */}
        <Guard for="class.view">
          <Stack gap="sm">
            <Title order={2} fz="lg">
              Classes
            </Title>
            {classes.length === 0 ? (
              <Text size="sm" c="dimmed">
                No classes for this level yet.
              </Text>
            ) : (
              classes.map((swimmingClass) => (
                <ClassCard key={swimmingClass.id} swimmingClass={swimmingClass} showLessons />
              ))
            )}
          </Stack>
        </Guard>
      </Stack>
    </Container>
  )
}
