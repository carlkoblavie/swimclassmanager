import { Form } from '@adonisjs/inertia/react'
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconCheck,
  IconCrown,
  IconLock,
  IconPackage,
  IconRipple,
  IconSparkles,
} from '@tabler/icons-react'
import DefaultLayout from '~/layouts/default'
import type { InertiaProps } from '~/types'
import type { ReactElement } from 'react'

type BankPack = {
  id: number
  key: string
  name: string
  description: string | null
  version: string
  planTier: string
  enabled: boolean
  enabledVersion: string | null
  lastSyncedVersion: string | null
  updateAvailable: boolean
  skillCount: number
  activityCount: number
}

type PageProps = InertiaProps<{
  packs: BankPack[]
}>

const starterBank = {
  name: 'Core Pack',
  version: '0.1',
  activityCount: 21,
  description:
    'The foundation activity set every school starts with: entries, floats, propulsion, safety and lesson-ready planning.',
}

export default function BankPacks({ packs }: PageProps) {
  const enabledPacks = packs.filter((pack) => pack.enabled)
  const enabledPackActivities = enabledPacks.reduce((total, pack) => total + pack.activityCount, 0)
  const activityCount = starterBank.activityCount + enabledPackActivities
  const hasLockedProPack = packs.some((pack) => pack.planTier === 'pro' && !pack.enabled)

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Box maw={700}>
            <Title order={1} fz={34} lh={1.1}>
              Bank packs
            </Title>
            <Text c="blue.9" opacity={0.62} size="md" mt={6} maw={640}>
              Curated activity sets, written by swim educators. Enable a pack and its content flows
              straight into your activity bank.
            </Text>
          </Box>
        </Group>

        <Group gap="md">
          <Paper withBorder radius="md" p="md" bg="white" miw={142}>
            <Text fw={900} fz={26} c="blue.7" lh={1}>
              {activityCount}
            </Text>
            <Text c="dimmed" fw={700} size="xs" mt={4}>
              Activities in bank
            </Text>
          </Paper>
          <Paper withBorder radius="md" p="md" bg="white" miw={142}>
            <Text fw={900} fz={26} c="dark.8" lh={1}>
              {enabledPacks.length + 1} of {packs.length + 1}
            </Text>
            <Text c="dimmed" fw={700} size="xs" mt={4}>
              Packs enabled
            </Text>
          </Paper>
        </Group>

        <Box
          p={{ base: 'lg', md: 28 }}
          style={{
            borderRadius: 18,
            background:
              'linear-gradient(135deg, var(--mantine-color-dark-9), var(--mantine-color-blue-9))',
            color: 'white',
          }}
        >
          <Group justify="space-between" align="center" gap="xl">
            <Stack gap="sm" maw={760}>
              <Badge
                leftSection={<IconCrown size={13} />}
                variant="outline"
                color="yellow"
                radius="xl"
                size="sm"
              >
                Pro
              </Badge>
              <Title order={2} c="white" fz={26} lh={1.15}>
                {hasLockedProPack ? 'The Pro Pack is one click away' : 'Your Pro packs are synced'}
              </Title>
              <Text c="blue.0" opacity={0.72} size="md" maw={760}>
                Pro adds educator-written activities for water safety, stroke refinement, pre-school
                play, and holiday intensives. Future releases can sync into each school activity
                bank.
              </Text>
            </Stack>
            <Button
              component="a"
              href="#available-packs"
              size="md"
              radius="md"
              color="yellow"
              c="dark.9"
              leftSection={hasLockedProPack ? <IconLock size={18} /> : <IconCheck size={18} />}
            >
              {hasLockedProPack ? 'View Pro packs' : 'Synced'}
            </Button>
          </Group>
        </Box>

        <Stack gap="md" id="available-packs">
          <Group justify="space-between">
            <Text tt="uppercase" fw={900} c="dimmed" style={{ letterSpacing: 1 }}>
              Available packs
            </Text>
            <Text c="dimmed" size="sm">
              {enabledPacks.length > 0
                ? 'Enabled packs sync automatically'
                : 'Enable a pack to sync it'}
            </Text>
          </Group>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Card withBorder radius="xl" padding={0} bg="white" style={{ overflow: 'hidden' }}>
              <Box
                h={118}
                p="md"
                style={{
                  background:
                    'linear-gradient(135deg, var(--mantine-color-blue-5), var(--mantine-color-blue-7))',
                  display: 'flex',
                  alignItems: 'flex-end',
                }}
              >
                <Group justify="space-between" w="100%">
                  <Group gap="sm">
                    <ThemeIcon variant="transparent" color="white">
                      <IconRipple size={20} />
                    </ThemeIcon>
                    <Text size="sm" tt="uppercase" fw={900} c="white" style={{ letterSpacing: 1 }}>
                      Included
                    </Text>
                  </Group>
                  <Badge color="blue" variant="light" radius="xl">
                    Starter
                  </Badge>
                </Group>
              </Box>
              <Stack gap="md" p="md">
                <div>
                  <Group gap="xs">
                    <Title order={3} fz={22}>
                      {starterBank.name}
                    </Title>
                    <Badge color="gray" variant="light">
                      v{starterBank.version}
                    </Badge>
                  </Group>
                  <Text c="dimmed" size="sm" mt="xs">
                    {starterBank.description}
                  </Text>
                </div>
                <Group gap="xs">
                  <Badge variant="default">Foundation</Badge>
                  <Badge variant="default">All stages</Badge>
                  <Badge variant="default">Core activities</Badge>
                </Group>
                <Divider />
                <Group justify="space-between">
                  <div>
                    <Text c="green.7" fw={800}>
                      Enabled
                    </Text>
                    <Text c="dimmed" size="sm">
                      {starterBank.activityCount} activities
                    </Text>
                  </div>
                  <Button variant="light" color="green" leftSection={<IconCheck size={18} />}>
                    Included
                  </Button>
                </Group>
              </Stack>
            </Card>

            {packs.map((pack) => (
              <Card
                key={pack.id}
                withBorder
                radius="xl"
                padding={0}
                bg="white"
                style={{ overflow: 'hidden' }}
              >
                <Box
                  h={118}
                  p="md"
                  style={{
                    background: pack.enabled
                      ? 'linear-gradient(135deg, var(--mantine-color-indigo-5), var(--mantine-color-violet-5))'
                      : 'linear-gradient(135deg, var(--mantine-color-gray-4), var(--mantine-color-violet-2))',
                    display: 'flex',
                    alignItems: 'flex-end',
                  }}
                >
                  <Group justify="space-between" w="100%">
                    <Group gap="sm">
                      <ThemeIcon variant="transparent" color="white">
                        <IconSparkles size={20} />
                      </ThemeIcon>
                      <Text
                        size="sm"
                        tt="uppercase"
                        fw={900}
                        c="white"
                        style={{ letterSpacing: 1 }}
                      >
                        {pack.planTier}
                      </Text>
                    </Group>
                    <Badge color={pack.enabled ? 'violet' : 'gray'} variant="light" radius="xl">
                      {pack.enabled ? 'Enabled' : 'Pro'}
                    </Badge>
                  </Group>
                </Box>
                <Stack gap="md" p="md">
                  <div>
                    <Group gap="xs">
                      <Title order={3} fz={22}>
                        {pack.name}
                      </Title>
                      <Badge color="gray" variant="light">
                        v{pack.version}
                      </Badge>
                    </Group>
                    <Text c="dimmed" size="sm" mt="xs">
                      {pack.description}
                    </Text>
                  </div>
                  <Group gap="xs">
                    <Badge variant="default">Water safety</Badge>
                    <Badge variant="default">Stroke work</Badge>
                    <Badge variant="default">Progressions</Badge>
                  </Group>
                  <Divider />
                  <Group justify="space-between">
                    <div>
                      <Text c={pack.enabled ? 'green.7' : 'dimmed'} fw={800}>
                        {pack.enabled
                          ? pack.updateAvailable
                            ? 'Updates available'
                            : 'Enabled · syncing'
                          : 'Ready to enable'}
                      </Text>
                      <Text c="dimmed" size="sm">
                        {pack.activityCount} activities
                      </Text>
                    </div>

                    <Form route="bank_packs.update" routeParams={{ id: pack.id }}>
                      {({ processing }) => (
                        <Button
                          type="submit"
                          variant={pack.enabled ? 'light' : 'filled'}
                          color={pack.enabled ? 'green' : 'dark'}
                          loading={processing}
                          leftSection={
                            pack.enabled ? <IconCheck size={18} /> : <IconPackage size={18} />
                          }
                        >
                          {pack.enabled ? 'Sync now' : 'Enable pack'}
                        </Button>
                      )}
                    </Form>
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Stack>
    </Container>
  )
}

BankPacks.layout = (page: ReactElement<InertiaProps>) => <DefaultLayout>{page}</DefaultLayout>
