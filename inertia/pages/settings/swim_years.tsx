import { useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core'
import { IconPlus, IconTrash, IconX } from '@tabler/icons-react'
import { router } from '@inertiajs/react'
import { Form } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'
import { urlFor } from '~/client'

type PageProps = InertiaProps<{
  swimYears: Data.SwimYear[]
}>

type TermDraft = {
  id?: number
  name: string
  startsOn: string
  endsOn: string
}

const STATUS_PROPS: Record<Data.SwimYear['status'], { color: string; label: string }> = {
  current: { color: 'green', label: 'Current' },
  upcoming: { color: 'aqua', label: 'Upcoming' },
  archived: { color: 'gray', label: 'Archived' },
}

// Mirrors the server's auto-naming: the years the range spans.
function autoYearName(startsOn: string, endsOn: string): string {
  const startYear = startsOn ? new Date(startsOn).getFullYear() : null
  const endYear = endsOn ? new Date(endsOn).getFullYear() : null
  if (!startYear || !endYear || Number.isNaN(startYear) || Number.isNaN(endYear)) {
    return '—'
  }
  return startYear === endYear ? String(startYear) : `${startYear}/${endYear}`
}

function SwimYearForm({ swimYear, onClose }: { swimYear?: Data.SwimYear; onClose: () => void }) {
  const [startsOn, setStartsOn] = useState(swimYear?.startsOn.raw ?? '')
  const [endsOn, setEndsOn] = useState(swimYear?.endsOn.raw ?? '')
  const [terms, setTerms] = useState<TermDraft[]>(
    swimYear
      ? swimYear.terms.map((term) => ({
          id: term.id,
          name: term.name,
          startsOn: term.startsOn.raw,
          endsOn: term.endsOn.raw,
        }))
      : [{ name: 'Term 1', startsOn: '', endsOn: '' }]
  )

  const setTerm = (index: number, patch: Partial<TermDraft>) =>
    setTerms((current) => current.map((term, i) => (i === index ? { ...term, ...patch } : term)))

  const addTerm = () =>
    setTerms((current) => [
      ...current,
      { name: `Term ${current.length + 1}`, startsOn: '', endsOn: '' },
    ])

  const removeTerm = (index: number) => setTerms((current) => current.filter((_, i) => i !== index))

  const formProps = swimYear
    ? ({ route: 'swim_years.update', routeParams: { id: swimYear.id } } as const)
    : ({ route: 'swim_years.store' } as const)

  return (
    <Card padding={0}>
      <Form {...formProps}>
        {({ errors, processing }) => (
          <>
            <Group justify="space-between" p="lg" pb="md">
              <Title order={3} fz="lg">
                {swimYear ? `Edit swim year ${swimYear.name}` : 'Create new swim year'}
              </Title>
              <ActionIcon variant="subtle" color="gray" aria-label="Close" onClick={onClose}>
                <IconX size={16} />
              </ActionIcon>
            </Group>
            <Divider />
            <Stack gap="lg" p="lg">
              <Stack gap="sm">
                <Text size="xs" tt="uppercase" c="dimmed" fw={700} lts="0.05em">
                  Swim year
                </Text>
                <Group gap="md" align="flex-start">
                  <TextInput
                    label="Start date"
                    type="date"
                    name="startsOn"
                    w={170}
                    value={startsOn}
                    onChange={(event) => setStartsOn(event.currentTarget.value)}
                    error={errors.startsOn}
                  />
                  <TextInput
                    label="End date"
                    type="date"
                    name="endsOn"
                    w={170}
                    value={endsOn}
                    onChange={(event) => setEndsOn(event.currentTarget.value)}
                    error={errors.endsOn}
                  />
                  <TextInput
                    label="Swim year name"
                    value={autoYearName(startsOn, endsOn)}
                    readOnly
                    disabled
                    w={170}
                    description="Set automatically from the start and end year."
                    rightSection={
                      <Badge variant="default" size="xs">
                        Auto
                      </Badge>
                    }
                    rightSectionWidth={54}
                  />
                </Group>
              </Stack>

              <Stack gap="xs">
                <Text size="xs" tt="uppercase" c="dimmed" fw={700} lts="0.05em">
                  Terms
                </Text>
                {terms.map((term, index) => (
                  <Group key={index} gap="sm" align="flex-end" wrap="nowrap">
                    <ThemeIcon variant="light" radius="md" size={26} mb={6}>
                      <Text fz={12} fw={800}>
                        {index + 1}
                      </Text>
                    </ThemeIcon>
                    {term.id !== undefined && (
                      <input type="hidden" name={`terms[${index}][id]`} value={term.id} />
                    )}
                    <TextInput
                      label="Term name"
                      name={`terms[${index}][name]`}
                      flex={1}
                      value={term.name}
                      onChange={(event) => setTerm(index, { name: event.currentTarget.value })}
                      error={errors[`terms.${index}.name`]}
                    />
                    <TextInput
                      label="Start"
                      type="date"
                      name={`terms[${index}][startsOn]`}
                      w={160}
                      value={term.startsOn}
                      onChange={(event) => setTerm(index, { startsOn: event.currentTarget.value })}
                      error={errors[`terms.${index}.startsOn`]}
                    />
                    <TextInput
                      label="End"
                      type="date"
                      name={`terms[${index}][endsOn]`}
                      w={160}
                      value={term.endsOn}
                      onChange={(event) => setTerm(index, { endsOn: event.currentTarget.value })}
                      error={errors[`terms.${index}.endsOn`]}
                    />
                    {terms.length > 1 && (
                      <Tooltip label="Remove term">
                        <ActionIcon
                          variant="default"
                          color="red"
                          size="lg"
                          mb={4}
                          aria-label={`Remove term ${index + 1}`}
                          onClick={() => removeTerm(index)}
                        >
                          <IconTrash size={14} color="var(--mantine-color-red-7)" />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                ))}
                <div>
                  <Button
                    type="button"
                    variant="subtle"
                    size="xs"
                    leftSection={<IconPlus size={14} />}
                    onClick={addTerm}
                  >
                    Add term
                  </Button>
                </div>
              </Stack>
            </Stack>
            <Divider />
            <Group justify="flex-end" gap="sm" p="md" px="lg" bg="gray.0">
              <Button type="button" variant="subtle" color="gray" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={processing}>
                Save swim year
              </Button>
            </Group>
          </>
        )}
      </Form>
    </Card>
  )
}

export default function SwimYearsSettings({ swimYears }: PageProps) {
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const editing = swimYears.find((swimYear) => swimYear.id === editingId)

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="xs" tt="uppercase" c="dimmed" fw={700} lts="0.05em">
              Settings
            </Text>
            <Title order={1}>Swim years</Title>
            <Text c="dimmed" size="sm" maw="60ch">
              A swim year runs from a start date to an end date and is named automatically after the
              years it spans (e.g. 2025/2026). Each swim year contains one or more named terms.
            </Text>
          </div>
          <Button
            onClick={() => {
              setCreating(true)
              setEditingId(null)
            }}
          >
            + Create new swim year
          </Button>
        </Group>

        {swimYears.length === 0 ? (
          <Card>
            <Text size="sm" c="dimmed">
              No swim years yet. Create one to start tying classes to terms.
            </Text>
          </Card>
        ) : (
          <Card padding={0}>
            <Text size="xs" tt="uppercase" c="dimmed" fw={700} lts="0.05em" p="md" px="lg">
              Swim years
            </Text>
            {swimYears.map((swimYear) => {
              const status = STATUS_PROPS[swimYear.status]
              return (
                <div key={swimYear.id}>
                  <Divider />
                  <Group justify="space-between" p="md" px="lg" wrap="wrap">
                    <div>
                      <Group gap="xs">
                        <Text fw={800}>{swimYear.name}</Text>
                        <Badge variant="light" color={status.color} size="sm">
                          {status.label}
                        </Badge>
                      </Group>
                      <Group gap="md" mt={2}>
                        <Text size="sm" c="dimmed">
                          <Text span size="sm" fw={600} c="var(--mantine-color-text)">
                            {swimYear.startsOn.formatted}
                          </Text>{' '}
                          –{' '}
                          <Text span size="sm" fw={600} c="var(--mantine-color-text)">
                            {swimYear.endsOn.formatted}
                          </Text>
                        </Text>
                        <Text size="sm" c="dimmed">
                          {swimYear.terms.length} {swimYear.terms.length === 1 ? 'term' : 'terms'}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {swimYear.classCount} {swimYear.classCount === 1 ? 'class' : 'classes'}
                        </Text>
                      </Group>
                    </div>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="default"
                        onClick={() => {
                          setEditingId(swimYear.id)
                          setCreating(false)
                        }}
                      >
                        Edit
                      </Button>
                      {swimYear.classCount === 0 && (
                        <Tooltip label="Remove swim year">
                          <ActionIcon
                            variant="default"
                            aria-label={`Remove swim year ${swimYear.name}`}
                            size="lg"
                            onClick={() =>
                              router.delete(urlFor('swim_years.destroy', { id: swimYear.id }))
                            }
                          >
                            <IconTrash size={14} color="var(--mantine-color-red-7)" />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  </Group>
                </div>
              )
            })}
          </Card>
        )}

        {creating && <SwimYearForm onClose={() => setCreating(false)} />}
        {editing && (
          <SwimYearForm key={editing.id} swimYear={editing} onClose={() => setEditingId(null)} />
        )}
      </Stack>
    </Container>
  )
}
