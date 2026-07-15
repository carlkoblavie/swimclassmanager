import { type Data } from '@generated/data'
import { toast, Toaster } from 'sonner'
import { usePage } from '@inertiajs/react'
import { useDisclosure } from '@mantine/hooks'
import { type ReactElement, useEffect } from 'react'
import { Form, Link } from '@adonisjs/inertia/react'
import { Guard } from '~/utils/permissions'
import {
  AppShell,
  Avatar,
  Burger,
  Button,
  Container,
  Group,
  NativeSelect,
  NavLink,
  Stack,
  Text,
} from '@mantine/core'

function Brand() {
  return (
    <Link route="home" aria-label="Home">
      <Text span fw={800} fz="lg" c="blue.6">
        Swim Class Manager
      </Text>
    </Link>
  )
}

function UserMenu({ initials }: { initials: string }) {
  return (
    <Group gap="sm">
      <Avatar radius="xl" size="sm" color="blue">
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
            <NavLink component={Link} route="home" label="Dashboard" active={url === '/'} />
            <NavLink
              component={Link}
              route="programs.index"
              label="Programs"
              active={url.startsWith('/programs')}
            />
            <Guard for="signup.view">
              <NavLink
                component={Link}
                route="signups.index"
                label="Sign-ups"
                active={url.startsWith('/signups')}
              />
            </Guard>
            <Guard for="invitation.create">
              <NavLink
                component={Link}
                route="invitations.create"
                label="Invite member"
                active={url.startsWith('/invitations')}
              />
            </Guard>
            <NavLink
              component={Link}
              route="schools.create"
              label="Create a school"
              active={url.startsWith('/schools')}
            />
          </Stack>
        </AppShell.Navbar>

        <AppShell.Main>{children}</AppShell.Main>

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

      <AppShell.Main>{children}</AppShell.Main>

      <Toaster position="top-center" richColors />
    </AppShell>
  )
}
