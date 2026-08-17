import { Link } from '@adonisjs/inertia/react'
import { Button, Container, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconArrowLeft, IconMapOff } from '@tabler/icons-react'

export default function NotFound() {
  return (
    <Container size="sm" py={{ base: 72, sm: 120 }}>
      <Stack gap="md" align="center" ta="center">
        <ThemeIcon variant="light" color="blue" radius="xl" size={64}>
          <IconMapOff size={30} stroke={1.6} />
        </ThemeIcon>
        <Text size="sm" fw={800} c="dimmed" tt="uppercase" style={{ letterSpacing: 1.2 }}>
          Error 404
        </Text>
        <Title order={1}>Page not found</Title>
        <Text c="dimmed" maw={420}>
          The page you were looking for does not exist or may have moved.
        </Text>
        <Button
          component={Link}
          route="home"
          leftSection={<IconArrowLeft size={17} stroke={1.8} />}
          mt="sm"
        >
          Back to dashboard
        </Button>
      </Stack>
    </Container>
  )
}
