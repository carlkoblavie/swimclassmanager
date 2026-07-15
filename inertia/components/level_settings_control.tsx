import { type FormEvent } from 'react'
import { useForm } from '@inertiajs/react'
import { Button, Group, Switch, TextInput } from '@mantine/core'
import { urlFor } from '~/client'
import type { Data } from '@generated/data'

export default function LevelSettingsControl({ level }: { level: Data.Level }) {
  const form = useForm({
    fee: String(level.fee.raw / 100),
    available: level.available,
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    form.transform((data) => ({
      fee: String(data.fee).trim() === '' ? null : Number(data.fee),
      available: data.available,
    }))
    form.patch(urlFor('level_settings.update', { id: level.id }))
  }

  return (
    <form onSubmit={submit}>
      <Group gap="sm" mt="sm" align="flex-end">
        <TextInput
          label="Your school's fee (GHS)"
          type="number"
          size="xs"
          w={170}
          value={form.data.fee}
          onChange={(event) => form.setData('fee', event.currentTarget.value)}
        />
        <Switch
          label="Available"
          checked={form.data.available}
          onChange={(event) => form.setData('available', event.currentTarget.checked)}
        />
        <Button type="submit" size="xs" variant="light" loading={form.processing}>
          Save
        </Button>
      </Group>
    </form>
  )
}
