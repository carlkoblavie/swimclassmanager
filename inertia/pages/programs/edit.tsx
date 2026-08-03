import { Button, Container, Group, Stack, Text, Title } from '@mantine/core'
import { Form } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import ProgramFormBody from '~/components/program_form_body'
import type { LevelDraft } from '~/components/level_form'
import type { SkillBankOption } from '~/components/stage_tree'

type PageProps = InertiaProps<{
  program: Data.Program.Variants['forEdit']
  skillBankSkills: SkillBankOption[]
}>

export default function EditProgram({ program, skillBankSkills }: PageProps) {
  const initial = {
    name: program.name,
    description: program.description,
    levels: program.levels.map(
      (level): LevelDraft => ({
        id: level.id,
        code: level.code,
        name: level.name,
        ageGroup: level.ageGroup,
        description: level.description,
        defaultFee: String(level.defaultFee),
        classesCount: level.classesCount === null ? '' : String(level.classesCount),
        audience: level.audience,
        stages: level.stages.map((stage) => ({
          id: stage.id,
          code: stage.code,
          name: stage.name,
          position: String(stage.position),
          classesCount: stage.classesCount === null ? '' : String(stage.classesCount),
          description: stage.description ?? '',
          skills: stage.skills.map((skill) => ({
            id: skill.id,
            name: skill.name,
            passCriteria: skill.passCriteria,
            description: skill.description ?? '',
            activities: skill.activities.map((activity) => ({
              id: activity.id,
              name: activity.name,
              description: activity.description ?? '',
              applicationNotes: activity.applicationNotes ?? '',
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

            <ProgramFormBody errors={errors} initial={initial} skillBankSkills={skillBankSkills} />
          </Stack>
        )}
      </Form>
    </Container>
  )
}
