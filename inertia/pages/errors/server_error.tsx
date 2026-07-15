import { Container, Stack, Text, Title } from '@mantine/core'

export default function ServerError() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="xs" align="center">
        <Title order={1}>Something went wrong</Title>
        <Text c="dimmed">An unexpected error occurred. Please try again.</Text>
      </Stack>
    </Container>
  )
}
