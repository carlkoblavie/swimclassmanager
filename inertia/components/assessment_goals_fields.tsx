import { ActionIcon, Button, Group, Stack, Text, TextInput } from '@mantine/core'
import { IconX } from '@tabler/icons-react'

export default function AssessmentGoalsFields({
  goals,
  onChange,
  error,
}: {
  goals: string[]
  onChange: (goals: string[]) => void
  error?: string
}) {
  return (
    <Stack gap="sm">
      <Group justify="space-between" align="baseline">
        <div>
          <Text fw={700}>Assessment goals</Text>
          <Text size="sm" c="dimmed">
            What instructors assess at the end of the class.
          </Text>
        </div>
        <Text size="sm" c="dimmed">
          {goals.filter((goal) => goal.trim() !== '').length} goal
          {goals.filter((goal) => goal.trim() !== '').length === 1 ? '' : 's'}
        </Text>
      </Group>

      {goals.map((goal, index) => (
        <Group key={index} gap="sm" wrap="nowrap" align="flex-start">
          <TextInput
            label={`Assessment goal ${index + 1}`}
            placeholder={
              index === 0
                ? 'e.g. Front float held for 10 seconds unaided'
                : 'e.g. Enters and exits the pool without help'
            }
            value={goal}
            onChange={(event) => {
              const next = [...goals]
              next[index] = event.currentTarget.value
              onChange(next)
            }}
            error={index === 0 ? error : undefined}
            style={{ flex: 1 }}
            required
          />
          <ActionIcon
            type="button"
            variant="subtle"
            color="gray"
            aria-label={`Remove assessment goal ${index + 1}`}
            disabled={goals.length === 1}
            onClick={() => onChange(goals.filter((_, goalIndex) => goalIndex !== index))}
            mt={30}
          >
            <IconX size={18} />
          </ActionIcon>
        </Group>
      ))}

      <Button
        type="button"
        variant="default"
        onClick={() => onChange([...goals, ''])}
        style={{ alignSelf: 'flex-start' }}
      >
        + Add goal
      </Button>
    </Stack>
  )
}
