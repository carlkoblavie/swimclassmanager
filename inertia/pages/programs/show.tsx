import { Anchor, Badge, Button, Card, Container, Group, Stack, Text, Title } from '@mantine/core'
import { Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import { urlFor } from '~/client'
import { Guard } from '~/utils/permissions'
import ClassCard from '~/components/class_card'

type PageProps = InertiaProps<{
  program: Data.Program
  classes: Data.SwimmingClass[]
  termOptions: Data.SwimYear[]
}>

export default function ProgramsShow({ program, classes }: PageProps) {
  const levels = program.levels ?? []

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Stack gap="xs">
          <Anchor component={Link} route="programs.index" size="sm">
            ← Swim Programs
          </Anchor>
          <Group justify="space-between" align="flex-start">
            <div>
              <Group gap="xs">
                <Title order={1}>{program.name}</Title>
                <Guard for="program.manage">
                  {program.isActive ? (
                    <Badge variant="light" color="green" size="sm">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="light" color="yellow" size="sm">
                      Draft
                    </Badge>
                  )}
                </Guard>
              </Group>
              <Badge variant="light" color="gray" size="sm">
                {program.code}
              </Badge>
              <Text c="dimmed" size="sm" mt={4}>
                {program.description}
              </Text>
            </div>
            <Guard for="program.manage">
              <Button
                component={Link}
                href={urlFor('programs.edit', { id: program.id })}
                variant="light"
              >
                Edit program
              </Button>
            </Guard>
          </Group>
        </Stack>

        {levels.length === 0 ? (
          <Text c="dimmed">This program has no levels yet.</Text>
        ) : (
          levels.map((level) => {
            const levelClasses = classes.filter(
              (swimmingClass) => swimmingClass.levelId === level.id
            )

            return (
              <Card key={level.id}>
                <Stack gap="sm">
                  <Stack gap={4}>
                    <Group gap="xs">
                      <Anchor
                        component={Link}
                        href={urlFor('levels.show', { id: level.id })}
                        fw={600}
                        fz="lg"
                      >
                        {level.name}
                      </Anchor>
                      <Badge variant="light" size="sm">
                        {level.ageGroup}
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
                    <Badge variant="light" color="gray" size="sm" w="fit-content">
                      {level.code}
                    </Badge>
                    <Text size="sm" c="dimmed">
                      {level.description}
                    </Text>
                    <Text size="sm">
                      {typeof level.capacity === 'number' && `Capacity: ${level.capacity} · `}
                      {level.fee.formatted}
                      {typeof level.classesCount === 'number' && ` · ${level.classesCount} classes`}
                    </Text>
                    {level.stages.length > 0 && (
                      <Text size="sm" c="dimmed">
                        Stages: {level.stages.map((stage) => stage.name).join(' → ')}
                      </Text>
                    )}
                  </Stack>

                  <Guard for="class.view">
                    <Stack gap="sm">
                      <Text size="xs" tt="uppercase" c="dimmed" fw={700}>
                        Classes
                      </Text>
                      {levelClasses.length === 0 ? (
                        <Text size="sm" c="dimmed">
                          No classes for this level yet.
                        </Text>
                      ) : (
                        levelClasses.map((swimmingClass) => (
                          <ClassCard
                            key={swimmingClass.id}
                            swimmingClass={swimmingClass}
                            showLessons
                          />
                        ))
                      )}
                    </Stack>
                  </Guard>
                </Stack>
              </Card>
            )
          })
        )}
      </Stack>
    </Container>
  )
}
