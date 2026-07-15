import { Button, Container, Group, Stack, Title } from '@mantine/core'
import { Form, Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import ClassFormBody from '~/components/class_form_body'

type PageProps = InertiaProps<{
  levelOptions: Data.Level.Variants['forClassOption'][]
  instructorOptions: Data.Membership[]
  skillOptions: Data.Skill[]
  preselectedLevelId?: number
}>

export default function CreateClass({
  levelOptions,
  instructorOptions,
  skillOptions,
  preselectedLevelId,
}: PageProps) {
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>Create a class</Title>
          <Button component={Link} route="programs.index" variant="subtle">
            Back to programs
          </Button>
        </Group>

        <Form route="swimming_classes.store">
          {({ errors, processing }) => (
            <ClassFormBody
              errors={errors}
              processing={processing}
              submitLabel="Create class"
              levelOptions={levelOptions}
              instructorOptions={instructorOptions}
              skillOptions={skillOptions}
              preselectedLevelId={preselectedLevelId}
            />
          )}
        </Form>
      </Stack>
    </Container>
  )
}
