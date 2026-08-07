import { Button, Container, Group, Stack, Text, Title } from '@mantine/core'
import { Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import { urlFor } from '~/client'
import ClassEditForm from '~/components/class_edit_form'
import type { ClassSkillOption } from '~/components/class_form'

type PageProps = InertiaProps<{
  swimmingClass: Data.SwimmingClass
  level: Data.Level
  instructorOptions: Data.Membership[]
  pendingInstructorOptions: Data.Invitation[]
  termOptions: Data.SwimYear[]
  skillBankSkills: ClassSkillOption[]
}>

export default function ClassEdit({
  swimmingClass,
  level,
  instructorOptions,
  pendingInstructorOptions,
  termOptions,
  skillBankSkills,
}: PageProps) {
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1}>Edit class</Title>
            <Text c="dimmed" size="sm">
              {swimmingClass.code} · {swimmingClass.level?.name} · lessons are planned from the
              class page.
            </Text>
          </div>
          <Button
            component={Link}
            href={urlFor('swimming_classes.show', { id: swimmingClass.id })}
            variant="subtle"
          >
            Back
          </Button>
        </Group>

        <ClassEditForm
          swimmingClass={swimmingClass}
          level={level}
          instructorOptions={instructorOptions}
          pendingInstructorOptions={pendingInstructorOptions}
          skillOptions={skillBankSkills}
          termOptions={termOptions}
        />
      </Stack>
    </Container>
  )
}
