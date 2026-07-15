import { Button, Container, Group, Stack, Title } from '@mantine/core'
import { Form, Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import { urlFor } from '~/client'
import ClassFormBody, { type ClassFormInitialValues } from '~/components/class_form_body'

type PageProps = InertiaProps<{
  swimmingClass: Data.SwimmingClass
  levelOptions: Data.Level.Variants['forClassOption'][]
  instructorOptions: Data.Membership[]
  skillOptions: Data.Skill[]
  initial: ClassFormInitialValues
}>

export default function EditClass({
  swimmingClass,
  levelOptions,
  instructorOptions,
  skillOptions,
  initial,
}: PageProps) {
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>Edit class</Title>
          <Button
            component={Link}
            href={urlFor('swimming_classes.show', { id: swimmingClass.id })}
            variant="subtle"
          >
            Back to class
          </Button>
        </Group>

        <Form route="swimming_classes.update" routeParams={{ id: swimmingClass.id }}>
          {({ errors, processing }) => (
            <ClassFormBody
              errors={errors}
              processing={processing}
              submitLabel="Save changes"
              levelOptions={levelOptions}
              instructorOptions={instructorOptions}
              skillOptions={skillOptions}
              initial={initial}
            />
          )}
        </Form>
      </Stack>
    </Container>
  )
}
