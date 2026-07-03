import { Badge, Card, Divider, Group, Stack, Text } from '@mantine/core'
import type { Data } from '@generated/data'

type Props = {
  signup: Data.Signup
}

export default function SignupCard({ signup }: Props) {
  const learners = signup.learners ?? []

  return (
    <Card withBorder radius="md" padding="lg">
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Text fw={600} size="lg">
            {signup.contactName}
          </Text>
          <Text size="sm" c="dimmed">
            {signup.createdAt.formatted}
          </Text>
        </Group>

        <Group gap="lg">
          <Text size="sm">{signup.contactEmail}</Text>
          <Text size="sm">{signup.contactPhone}</Text>
          {signup.whatsapp && <Text size="sm">WhatsApp: {signup.whatsapp}</Text>}
        </Group>

        {signup.message && (
          <Text size="sm" c="dimmed">
            {signup.message}
          </Text>
        )}

        <Divider label={`Learners (${learners.length})`} labelPosition="left" />

        <Stack gap="sm">
          {learners.map((learner) => (
            <div key={learner.id}>
              <Group gap="xs">
                <Text fw={500}>
                  {learner.firstName} {learner.lastName}
                </Text>
                <Badge variant="light" size="sm">
                  {learner.gender}
                </Badge>
                <Text size="sm" c="dimmed">
                  {learner.dateOfBirth.formatted}
                </Text>
              </Group>
              <Text size="sm">
                Nationality: {learner.nationality} · Location: {learner.residentialLocation}
              </Text>
              <Text size="sm">Medical: {learner.medicalInfo}</Text>
              {learner.swimmingExperience && (
                <Text size="sm">Experience: {learner.swimmingExperience}</Text>
              )}
            </div>
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}
