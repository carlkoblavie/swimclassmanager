import { Fragment, useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import { useDisclosure } from '@mantine/hooks'
import {
  Anchor,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import type { InertiaProps } from '~/types'
import LearnerModal, { type LearnerDraft } from '~/components/learner_modal'

type PageProps = InertiaProps<{
  club: { name: string }
  slug: string
  genders: string[]
}>

export default function RegisterLearner({ club, slug, genders }: PageProps) {
  const [learners, setLearners] = useState<LearnerDraft[]>([])
  const [opened, { open, close }] = useDisclosure(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const openAdd = () => {
    setEditingIndex(null)
    open()
  }
  const openEdit = (index: number) => {
    setEditingIndex(index)
    open()
  }
  const remove = (index: number) => setLearners((current) => current.filter((_, i) => i !== index))
  const save = (draft: LearnerDraft) =>
    setLearners((current) =>
      editingIndex === null
        ? [...current, draft]
        : current.map((learner, i) => (i === editingIndex ? draft : learner))
    )

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Sign up with {club.name}</Title>
          <Text c="dimmed">Register a learner for lessons — no account needed.</Text>
        </div>

        <Form route="signups.store" routeParams={{ slug }}>
          {({ errors, processing }) => (
            <Stack gap="lg">
              <Stack gap="md">
                <Title order={3}>Your details</Title>
                <TextInput label="Your name" name="contactName" error={errors.contactName} />
                <TextInput
                  label="Email"
                  type="email"
                  name="contactEmail"
                  error={errors.contactEmail}
                />
                <TextInput
                  label="Phone"
                  type="tel"
                  name="contactPhone"
                  error={errors.contactPhone}
                />
                <TextInput
                  label="WhatsApp number"
                  description="Optional"
                  name="whatsapp"
                  error={errors.whatsapp}
                />
              </Stack>

              <Divider />

              <Stack gap="sm">
                <Group justify="space-between">
                  <Title order={3}>Learners</Title>
                  <Button variant="light" size="sm" onClick={openAdd}>
                    Add learner
                  </Button>
                </Group>

                {learners.length === 0 ? (
                  <Text c="dimmed" size="sm">
                    No learners added yet. Add at least one.
                  </Text>
                ) : (
                  learners.map((learner, index) => (
                    <Card key={index} withBorder padding="sm" radius="md">
                      <Group justify="space-between">
                        <Text fw={500}>
                          {learner.firstName} {learner.lastName}
                        </Text>
                        <Group gap="md">
                          <Anchor
                            component="button"
                            type="button"
                            size="sm"
                            onClick={() => openEdit(index)}
                          >
                            Edit
                          </Anchor>
                          <Anchor
                            component="button"
                            type="button"
                            size="sm"
                            c="red"
                            onClick={() => remove(index)}
                          >
                            Remove
                          </Anchor>
                        </Group>
                      </Group>
                    </Card>
                  ))
                )}

                {errors.learners && (
                  <Text c="red" size="sm">
                    {errors.learners}
                  </Text>
                )}

                {learners.map((learner, index) => (
                  <Fragment key={index}>
                    <input
                      type="hidden"
                      name={`learners[${index}][firstName]`}
                      value={learner.firstName}
                    />
                    <input
                      type="hidden"
                      name={`learners[${index}][lastName]`}
                      value={learner.lastName}
                    />
                    <input
                      type="hidden"
                      name={`learners[${index}][dateOfBirth]`}
                      value={learner.dateOfBirth}
                    />
                    <input
                      type="hidden"
                      name={`learners[${index}][gender]`}
                      value={learner.gender}
                    />
                    <input
                      type="hidden"
                      name={`learners[${index}][nationality]`}
                      value={learner.nationality}
                    />
                    <input
                      type="hidden"
                      name={`learners[${index}][residentialLocation]`}
                      value={learner.residentialLocation}
                    />
                    <input
                      type="hidden"
                      name={`learners[${index}][medicalInfo]`}
                      value={learner.medicalInfo}
                    />
                    {learner.swimmingExperience && (
                      <input
                        type="hidden"
                        name={`learners[${index}][swimmingExperience]`}
                        value={learner.swimmingExperience}
                      />
                    )}
                  </Fragment>
                ))}
              </Stack>

              <Divider />

              <Textarea
                label="Message"
                description="Optional"
                name="message"
                error={errors.message}
                autosize
                minRows={3}
              />

              <Button type="submit" size="md" loading={processing} disabled={learners.length === 0}>
                Submit sign-up
              </Button>
            </Stack>
          )}
        </Form>
      </Stack>

      <LearnerModal
        opened={opened}
        onClose={close}
        onSave={save}
        initial={editingIndex !== null ? learners[editingIndex] : undefined}
        genders={genders}
      />
    </Container>
  )
}
