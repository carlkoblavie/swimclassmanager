import { type Data } from '@generated/data'
import { toast, Toaster } from 'sonner'
import { usePage } from '@inertiajs/react'
import { useDisclosure } from '@mantine/hooks'
import { type ComponentProps, type ReactElement, type ReactNode, useEffect } from 'react'
import { Form, Link } from '@adonisjs/inertia/react'
import { Guard } from '~/utils/permissions'
import {
  AppShell,
  Avatar,
  Burger,
  Button,
  Container,
  Divider,
  Group,
  NativeSelect,
  NavLink,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'
import {
  IconClipboardList,
  IconLayoutDashboard,
  IconRipple,
  IconSchool,
  IconSettings,
  IconStack2,
  IconSwimming,
  IconUserPlus,
} from '@tabler/icons-react'

function Brand() {
  return (
    <Link route="home" aria-label="Home" style={{ textDecoration: 'none' }}>
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon size="lg" radius="md">
          <IconRipple size={22} stroke={1.8} />
        </ThemeIcon>
        <div>
          <Text fw={800} fz="md" c="var(--mantine-color-text)" lh={1.2}>
            Swim Class Manager
          </Text>
          <Text fz={10} tt="uppercase" c="dimmed" fw={600} lh={1.2} style={{ letterSpacing: 1 }}>
            Management
          </Text>
        </div>
      </Group>
    </Link>
  )
}

function UserMenu({ initials }: { initials: string }) {
  return (
    <Group gap="sm">
      <Avatar radius="xl" size="sm" color="aqua">
        {initials}
      </Avatar>
      <Form route="sessions.destroy">
        <Button type="submit" variant="subtle" color="gray" size="sm">
          Logout
        </Button>
      </Form>
    </Group>
  )
}

function SidebarLink({
  route,
  label,
  icon,
  active,
}: {
  route: ComponentProps<typeof Link>['route']
  label: string
  icon: ReactNode
  active: boolean
}) {
  return (
    <NavLink
      component={Link}
      route={route}
      label={label}
      leftSection={icon}
      active={active}
      style={{ borderRadius: 'var(--mantine-radius-md)' }}
    />
  )
}

function useFlashToasts(children: ReactElement<Data.SharedProps>) {
  const { url } = usePage()

  useEffect(() => {
    toast.dismiss()
  }, [url])

  useEffect(() => {
    if (children.props.flash.error) {
      toast.error(children.props.flash.error)
    }
    if (children.props.flash.success) {
      toast.success(children.props.flash.success)
    }
  })
}

export default function Layout({ children }: { children: ReactElement<Data.SharedProps> }) {
  const [opened, { toggle }] = useDisclosure()
  const { url } = usePage()
  useFlashToasts(children)

  const { user, activeOrganisation, activeSchool, availableSchools } = children.props

  // Signed into a school → full app shell with a sidebar.
  if (activeSchool) {
    return (
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
        padding="lg"
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group gap="sm">
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
              <Brand />
            </Group>
            {user && <UserMenu initials={user.initials} />}
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <Stack h="100%" justify="space-between" gap="md">
            <Stack gap={4}>
              {activeOrganisation && (
                <Text size="xs" tt="uppercase" c="dimmed" fw={700}>
                  {activeOrganisation.name}
                </Text>
              )}
              <Text size="sm" fw={700} mb={4}>
                {activeSchool.name}
              </Text>
              {availableSchools.length > 1 && (
                <Form route="active_schools.update">
                  {({ processing }) => (
                    <Group gap="xs" align="end" mb="sm">
                      <NativeSelect
                        flex={1}
                        size="xs"
                        label="Switch school"
                        name="schoolId"
                        defaultValue={String(activeSchool.id)}
                        data={availableSchools.map((school) => ({
                          value: String(school.id),
                          label: school.name,
                        }))}
                      />
                      <Button type="submit" size="xs" variant="light" loading={processing}>
                        Switch
                      </Button>
                    </Group>
                  )}
                </Form>
              )}
              <SidebarLink
                route="home"
                label="Dashboard"
                icon={<IconLayoutDashboard size={18} stroke={1.6} />}
                active={url === '/'}
              />
              <SidebarLink
                route="programs.index"
                label="Programs"
                icon={<IconStack2 size={18} stroke={1.6} />}
                active={url.startsWith('/programs')}
              />
              <Guard for="class.view">
                <SidebarLink
                  route="swimming_classes.index"
                  label="Classes"
                  icon={<IconSwimming size={18} stroke={1.6} />}
                  active={url.startsWith('/classes')}
                />
              </Guard>
              <Guard for="signup.view">
                <SidebarLink
                  route="signups.index"
                  label="Sign-ups"
                  icon={<IconClipboardList size={18} stroke={1.6} />}
                  active={url.startsWith('/signups')}
                />
              </Guard>
              <Guard for="invitation.create">
                <SidebarLink
                  route="invitations.create"
                  label="Invite member"
                  icon={<IconUserPlus size={18} stroke={1.6} />}
                  active={url.startsWith('/invitations')}
                />
              </Guard>
              <Guard for="settings.manage">
                <SidebarLink
                  route="swim_years.index"
                  label="Settings"
                  icon={<IconSettings size={18} stroke={1.6} />}
                  active={url.startsWith('/settings')}
                />
              </Guard>
            </Stack>

            <Stack gap={4}>
              <Divider />
              <SidebarLink
                route="schools.create"
                label="Create a school"
                icon={<IconSchool size={18} stroke={1.6} />}
                active={url.startsWith('/schools')}
              />
            </Stack>
          </Stack>
        </AppShell.Navbar>

        <AppShell.Main bg="gray.0">{children}</AppShell.Main>

        <Toaster position="top-center" richColors />
      </AppShell>
    )
  }

  // Public / onboarding pages (login, register, errors, profile setup) → clean, no sidebar.
  return (
    <AppShell header={{ height: 60 }} padding="lg">
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group h="100%" justify="space-between">
            <Brand />
            {user ? (
              <UserMenu initials={user.initials} />
            ) : (
              <Button component={Link} route="sign_in_links.create" variant="subtle" size="sm">
                Login
              </Button>
            )}
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main bg="gray.0">{children}</AppShell.Main>

      <Toaster position="top-center" richColors />
    </AppShell>
  )
}
