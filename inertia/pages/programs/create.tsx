import { Button, Container, Group, Stack, Text, Title } from '@mantine/core'
import { Form } from '@adonisjs/inertia/react'
import ProgramFormBody from '~/components/program_form_body'
import type { SkillBankOption } from '~/components/stage_tree'
import type { InertiaProps } from '~/types'

type PageProps = InertiaProps<{
  skillBankSkills: SkillBankOption[]
}>

export default function CreateProgram({ skillBankSkills }: PageProps) {
  return (
    <Container size="lg" py="xl">
      <Form route="programs.store">
        {({ errors, processing }) => (
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={1}>Create a program</Title>
                <Text c="dimmed" size="sm">
                  Build the curriculum from the top down: the program, then its levels.
                </Text>
              </div>
              <Group gap="sm">
                <Button
                  type="submit"
                  name="intent"
                  value="draft"
                  variant="default"
                  loading={processing}
                >
                  Save as draft
                </Button>
                <Button type="submit" name="intent" value="publish" loading={processing}>
                  Publish program
                </Button>
              </Group>
            </Group>

            <ProgramFormBody errors={errors} skillBankSkills={skillBankSkills} />
          </Stack>
        )}
      </Form>
    </Container>
  )
}
