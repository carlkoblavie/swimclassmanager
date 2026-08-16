import { Link } from '@adonisjs/inertia/react'
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Paper,
  Stack,
  Switch,
  Tabs,
  Text,
  Title,
} from '@mantine/core'
import { IconPlus, IconUsers } from '@tabler/icons-react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'

type PageProps = InertiaProps<{
  members: Data.Membership[]
  invitations: Data.Invitation[]
  currentUserId: number
}>

function initials(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.split('@')[0] || 'Member'
  return source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function roleLabel(role: string | undefined): string {
  if (role === 'Teacher') {
    return 'Instructor'
  }
  return role ?? 'Member'
}

function lessonLabel(count: number): string {
  return `${count} ${count === 1 ? 'lesson' : 'lessons'}`
}

function MemberRow({ member, currentUserId }: { member: Data.Membership; currentUserId: number }) {
  const name = member.user?.fullName?.trim() || member.user?.email || member.label
  const email = member.user?.email ?? ''
  const role = roleLabel(member.roles[0])
  const lessonsCount = member.lessonsCount ?? 0

  return (
    <Group
      wrap="nowrap"
      px="lg"
      py="md"
      gap="lg"
      style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
    >
      <Group wrap="nowrap" gap="md" style={{ flex: '1 1 32%', minWidth: 220 }}>
        <Avatar size="lg" radius="xl" color="blue">
          {initials(member.user?.fullName ?? null, email)}
        </Avatar>
        <Box style={{ minWidth: 0 }}>
          <Group gap="xs" wrap="nowrap">
            <Text fw={700} truncate>
              {name}
            </Text>
            {member.user?.id === currentUserId && (
              <Badge variant="light" color="gray" radius="xl">
                You
              </Badge>
            )}
          </Group>
          <Text size="sm" c="dimmed" truncate>
            {email}
          </Text>
        </Box>
      </Group>

      <Text style={{ flex: '1 1 24%' }} c="dimmed">
        {role}
      </Text>

      <Group gap="xs" style={{ flex: '0 0 150px' }}>
        <Text c="teal.8" fw={700} tt="uppercase" size="sm">
          <Text span c="teal.6" mr={6}>
            ●
          </Text>
          Active
        </Text>
      </Group>

      <Text
        component={Link}
        route="lessons.index"
        c="dark"
        fw={600}
        td="underline"
        style={{ flex: '0 0 110px' }}
      >
        {lessonLabel(lessonsCount)}
      </Text>

      <Switch checked readOnly aria-label={`${name} active`} color="blue" />
    </Group>
  )
}

function InvitationRow({ invitation }: { invitation: Data.Invitation }) {
  const name = invitation.fullName || invitation.email

  return (
    <Group
      wrap="nowrap"
      px="lg"
      py="md"
      gap="lg"
      style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
    >
      <Group wrap="nowrap" gap="md" style={{ flex: '1 1 32%', minWidth: 220 }}>
        <Avatar size="lg" radius="xl" color="gray">
          {initials(invitation.fullName, invitation.email)}
        </Avatar>
        <Box style={{ minWidth: 0 }}>
          <Text fw={700} truncate>
            {name}
          </Text>
          <Text size="sm" c="dimmed" truncate>
            {invitation.email}
          </Text>
        </Box>
      </Group>
      <Text style={{ flex: '1 1 24%' }} c="dimmed">
        {roleLabel(invitation.role)}
      </Text>
      <Text c="orange.8" fw={700} tt="uppercase" size="sm" style={{ flex: '0 0 150px' }}>
        <Text span c="orange.6" mr={6}>
          ●
        </Text>
        Invited
      </Text>
      <Text c="dimmed" style={{ flex: '0 0 110px' }}>
        —
      </Text>
      <Box w={28} />
    </Group>
  )
}

export default function MembersIndex({
  members,
  invitations,
  currentUserId,
  activeSchool,
}: PageProps) {
  const disabledCount = 0

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap="xs">
            <Text c="dimmed" fw={700} tt="uppercase" size="sm" style={{ letterSpacing: 1.5 }}>
              {activeSchool?.name} · Team
            </Text>
            <Title order={1}>Members</Title>
            <Text c="dimmed" size="lg" maw={760}>
              Manage who belongs to your school, their roles, and their access to lessons.
            </Text>
          </Stack>
          <Text c="dimmed" size="lg" style={{ whiteSpace: 'nowrap' }}>
            {members.length} active · {invitations.length} invited · {disabledCount} disabled
          </Text>
        </Group>

        <Tabs defaultValue="active" variant="pills">
          <Group justify="space-between" align="center">
            <Tabs.List bg="gray.1" p={4} style={{ borderRadius: 14 }}>
              <Tabs.Tab value="active">Active ({members.length})</Tabs.Tab>
              <Tabs.Tab value="invited">Invited ({invitations.length})</Tabs.Tab>
              <Tabs.Tab value="disabled">Disabled ({disabledCount})</Tabs.Tab>
            </Tabs.List>
            <Button
              component={Link}
              route="invitations.create"
              leftSection={<IconPlus size={18} />}
            >
              Invite member
            </Button>
          </Group>

          <Tabs.Panel value="active">
            <Paper withBorder radius="lg" style={{ overflow: 'hidden' }}>
              {members.length > 0 ? (
                members.map((member) => (
                  <MemberRow key={member.id} member={member} currentUserId={currentUserId} />
                ))
              ) : (
                <Card padding="xl">
                  <Stack align="center" gap="xs">
                    <IconUsers size={32} color="var(--mantine-color-gray-5)" />
                    <Text fw={700}>No active members yet</Text>
                    <Text c="dimmed" size="sm">
                      Invite someone to start building your team.
                    </Text>
                  </Stack>
                </Card>
              )}
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="invited">
            <Paper withBorder radius="lg" style={{ overflow: 'hidden' }}>
              {invitations.length > 0 ? (
                invitations.map((invitation) => (
                  <InvitationRow key={invitation.id} invitation={invitation} />
                ))
              ) : (
                <Card padding="xl">
                  <Stack align="center" gap="xs">
                    <Text fw={700}>No pending invitations</Text>
                    <Text c="dimmed" size="sm">
                      Invitations that have not been accepted will appear here.
                    </Text>
                  </Stack>
                </Card>
              )}
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="disabled">
            <Paper withBorder radius="lg" p="xl">
              <Stack align="center" gap="xs">
                <Text fw={700}>No disabled members</Text>
                <Text c="dimmed" size="sm">
                  Disabled members will appear here while keeping their history.
                </Text>
              </Stack>
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  )
}
