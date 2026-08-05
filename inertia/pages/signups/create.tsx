import { Fragment, ReactElement, useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import { useDisclosure } from '@mantine/hooks'
import {
  Anchor,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import {
  IconArrowRight,
  IconMail,
  IconMessageCircle,
  IconPhone,
  IconPlus,
  IconUser,
} from '@tabler/icons-react'
import { type Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import AuthLayout from '~/layouts/auth'
import LearnerModal, { type LearnerDraft } from '~/components/learner_modal'

type PageProps = InertiaProps<{
  school: { name: string }
  organisationSlug: string
  schoolSlug: string
  genders: string[]
}>

function RegisterLearner({ school, organisationSlug, schoolSlug, genders }: PageProps) {
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
    <>
      <Stack gap={28}>
        <Stack gap={8}>
          <Badge variant="light" color="aqua" w="fit-content">
            {school.name}
          </Badge>
          <Title order={1} className="auth-page-title">
            Create your sign-up
          </Title>
          <Text c="dimmed" fz="md">
            Register a learner for lessons. No account is needed to send your details to the
            school.
          </Text>
        </Stack>

        <Form route="signups.store" routeParams={{ organisationSlug, schoolSlug }}>
          {({ errors, processing }) => (
            <Stack gap="lg">
              <Stack gap="md">
                <Title order={2} className="auth-section-title">
                  Your details
                </Title>
                <TextInput
                  label="Your name"
                  name="contactName"
                  placeholder="Jane Doe"
                  leftSection={<IconUser size={18} stroke={1.7} />}
                  error={errors.contactName}
                />
                <TextInput
                  label="Email"
                  type="email"
                  name="contactEmail"
                  placeholder="name@example.com"
                  leftSection={<IconMail size={18} stroke={1.7} />}
                  error={errors.contactEmail}
                />
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <TextInput
                    label="Phone"
                    type="tel"
                    name="contactPhone"
                    placeholder="+233 20 000 0000"
                    leftSection={<IconPhone size={18} stroke={1.7} />}
                    error={errors.contactPhone}
                  />
                  <TextInput
                    label="WhatsApp number"
                    name="whatsapp"
                    placeholder="+233 20 000 0000"
                    leftSection={<IconMessageCircle size={18} stroke={1.7} />}
                    error={errors.whatsapp}
                    required
                  />
                </SimpleGrid>
                <NativeSelect
                  label="Who is registering?"
                  name="registrantRole"
                  defaultValue="guardian"
                  data={[
                    { value: 'guardian', label: 'Parent / Guardian (registering someone else)' },
                    { value: 'adult_learner', label: 'Adult learner (registering myself)' },
                  ]}
                  error={errors.registrantRole}
                />
              </Stack>

              <Divider />

              <Stack gap="sm">
                <Group justify="space-between" align="center">
                  <Title order={2} className="auth-section-title">
                    Learners
                  </Title>
                  <Button
                    variant="light"
                    size="sm"
                    onClick={openAdd}
                    leftSection={<IconPlus size={16} stroke={1.8} />}
                  >
                    Add learner
                  </Button>
                </Group>

                {learners.length === 0 ? (
                  <Card padding="md" radius="md" withBorder className="auth-empty-card">
                    <Text c="dimmed" size="sm">
                      Add at least one learner to continue.
                    </Text>
                  </Card>
                ) : (
                  learners.map((learner, index) => (
                    <Card key={index} padding="sm" radius="md" withBorder>
                      <Group justify="space-between" wrap="nowrap">
                        <Stack gap={0}>
                          <Text fw={600}>
                            {learner.firstName} {learner.lastName}
                          </Text>
                          <Text c="dimmed" size="xs">
                            {learner.dateOfBirth}
                          </Text>
                        </Stack>
                        <Group gap="md" wrap="nowrap">
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
                      name={`learners[${index}][relation]`}
                      value={learner.relation}
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

              <Textarea
                label="Message"
                description="Optional"
                name="message"
                placeholder="Share goals, scheduling notes, or anything the school should know."
                error={errors.message}
                autosize
                minRows={3}
              />

              <Button
                type="submit"
                size="md"
                loading={processing}
                disabled={learners.length === 0}
                rightSection={<IconArrowRight size={18} stroke={1.8} />}
              >
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
    </>
  )
}

;(RegisterLearner as { layout?: (page: ReactElement<Data.SharedProps>) => ReactElement }).layout = (
  page
) => <AuthLayout>{page}</AuthLayout>

export default RegisterLearner
