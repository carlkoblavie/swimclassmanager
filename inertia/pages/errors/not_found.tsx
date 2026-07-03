import { Container, Stack, Text, Title } from '@mantine/core'

export default function NotFound() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="xs" align="center">
        <Title order={1}>Page not found</Title>
        <Text c="dimmed">The page you were looking for could not be found.</Text>
      </Stack>
    </Container>
  )
}
