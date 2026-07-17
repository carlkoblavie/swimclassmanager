import { ReactElement, useEffect } from 'react'
import { toast, Toaster } from 'sonner'
import { Box, Container, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconRipple, IconShieldCheck } from '@tabler/icons-react'
import { type Data } from '@generated/data'

export default function AuthLayout({ children }: { children: ReactElement<Data.SharedProps> }) {
  const { flash } = children.props

  useEffect(() => {
    if (flash.error) {
      toast.error(flash.error)
    }
    if (flash.success) {
      toast.success(flash.success)
    }
  }, [flash.error, flash.success])

  return (
    <Box className="auth-page-shell">
      <Container size={1180} className="auth-page-container">
        <Box className="auth-visual-panel">
          <Box className="auth-abstract-art" />
          <Stack gap="xs" className="auth-visual-copy">
            <Title order={2}>Run Swim School Operations</Title>
            <Text>
              Professional class, learner, and programme management for modern swim schools.
            </Text>
          </Stack>
        </Box>

        <Box className="auth-content-panel">
          <Stack gap={32} className="auth-content-stack">
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon size={40} radius="md">
                <IconShieldCheck size={24} stroke={1.8} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text fw={800} fz="lg" lh={1.2}>
                  Swim Class Manager
                </Text>
                <Group gap={5}>
                  <IconRipple size={14} stroke={1.8} color="var(--mantine-color-aqua-6)" />
                  <Text fz="xs" c="dimmed" fw={600}>
                    Operations portal
                  </Text>
                </Group>
              </Stack>
            </Group>

            {children}
          </Stack>
        </Box>
      </Container>
      <Toaster position="top-center" richColors />
    </Box>
  )
}
