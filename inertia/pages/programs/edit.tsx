import { Button, Container, Group, Stack, Text, Title } from '@mantine/core'
import { Form } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import ProgramFormBody from '~/components/program_form_body'
import type { LevelDraft } from '~/components/level_modal'

type PageProps = InertiaProps<{
  program: Data.Program.Variants['forEdit']
}>

export default function EditProgram({ program }: PageProps) {
  const initial = {
    name: program.name,
    description: program.description,
    levels: program.levels.map(
      (level): LevelDraft => ({
        id: level.id,
        name: level.name,
        ageGroup: level.ageGroup,
        description: level.description,
        defaultFee: String(level.defaultFee),
        capacity: String(level.capacity),
        stages: level.stages.map((stage) => ({
          name: stage.name,
          position: String(stage.position),
          description: stage.description ?? '',
          skills: stage.skills.map((skill) => ({
            name: skill.name,
            passCriteria: skill.passCriteria,
            description: skill.description ?? '',
            activities: skill.activities.map((activity) => ({
              name: activity.name,
              durationMinutes: String(activity.durationMinutes),
              description: activity.description ?? '',
            })),
          })),
        })),
      })
    ),
  }

  return (
    <Container size="lg" py="xl">
      <Form route="programs.update" routeParams={{ id: program.id }}>
        {({ errors, processing }) => (
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={1}>Edit program</Title>
                <Text c="dimmed" size="sm">
                  Update the program details and its levels.
                </Text>
              </div>
              <Button type="submit" loading={processing}>
                Save changes
              </Button>
            </Group>

            <ProgramFormBody errors={errors} initial={initial} />
          </Stack>
        )}
      </Form>
    </Container>
  )
}
