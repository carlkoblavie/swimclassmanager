import { useState } from 'react'
import { Button, Card, Code, Group, Stack, Text } from '@mantine/core'
import { urlFor } from '~/client'

type Props = {
  organisationSlug: string
  schoolSlug: string
}

export default function ShareSignupLink({ organisationSlug, schoolSlug }: Props) {
  const path = urlFor('signups.create', { organisationSlug, schoolSlug })
  const [copied, setCopied] = useState(false)

  const copy = () => {
    void navigator.clipboard.writeText(`${window.location.origin}${path}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card withBorder radius="md" padding="md">
      <Stack gap="xs">
        <Text fw={600}>Public sign-up link</Text>
        <Text size="sm" c="dimmed">
          Share this with prospective learners — it is always live and needs no account.
        </Text>
        <Group wrap="nowrap">
          <Code>{path}</Code>
          <Button size="xs" variant="light" onClick={copy}>
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </Group>
      </Stack>
    </Card>
  )
}
