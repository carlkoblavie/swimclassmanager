import { Fragment, useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  MultiSelect,
  NativeSelect,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import type { Data } from '@generated/data'

const WEEKDAYS = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '7', label: 'Sunday' },
]

function weekdayLabel(value: string): string {
  return WEEKDAYS.find((day) => day.value === value)?.label ?? value
}

type DayDraft = {
  weekday: string
  startTime: string
  durationMinutes: string
  name: string
  nameTouched: boolean
  levelStageId: string
  skillIds: string[]
  activityIds: string[]
}

function autoName(baseName: string, levelName: string, weekday: string): string {
  const base = baseName.trim() || levelName
  return `${base} — ${weekdayLabel(weekday)}`
}

export default function ClassInlineBuilder({
  level,
  onClose,
}: {
  level: Data.Level
  onClose: () => void
}) {
  const stages = level.stages ?? []

  const newDay = (baseName: string, weekday = '1'): DayDraft => ({
    weekday,
    startTime: '17:00',
    durationMinutes: '45',
    name: autoName(baseName, level.name, weekday),
    nameTouched: false,
    levelStageId: stages[0] ? String(stages[0].id) : '',
    skillIds: [],
    activityIds: [],
  })

  const [baseName, setBaseName] = useState('')
  const [days, setDays] = useState<DayDraft[]>([newDay('')])

  const setDay = (index: number, patch: Partial<DayDraft>) =>
    setDays((current) => current.map((day, i) => (i === index ? { ...day, ...patch } : day)))

  const changeBaseName = (value: string) => {
    setBaseName(value)
    setDays((current) =>
      current.map((day) =>
        day.nameTouched ? day : { ...day, name: autoName(value, level.name, day.weekday) }
      )
    )
  }

  const changeWeekday = (index: number, weekday: string) =>
    setDays((current) =>
      current.map((day, i) =>
        i === index
          ? {
              ...day,
              weekday,
              name: day.nameTouched ? day.name : autoName(baseName, level.name, weekday),
            }
          : day
      )
    )

  const addDay = () =>
    setDays((current) => {
      const used = new Set(current.map((day) => day.weekday))
      const next = WEEKDAYS.find((day) => !used.has(day.value))?.value ?? '1'
      return [...current, newDay(baseName, next)]
    })

  const removeDay = (index: number) =>
    setDays((current) => current.filter((_, i) => i !== index))

  if (stages.length === 0) {
    return (
      <Card bg="gray.0" shadow="none">
        <Group justify="space-between">
          <Text size="sm">
            This level has no stages yet — add curriculum to the program before scheduling classes.
          </Text>
          <Button type="button" variant="default" size="xs" onClick={onClose}>
            Close
          </Button>
        </Group>
      </Card>
    )
  }

  return (
    <Card bg="gray.0" shadow="none">
      <Form route="swimming_classes.store">
        {({ errors, processing }) => (
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <Text fw={700}>{level.name}</Text>
                <Badge variant="light" size="sm">
                  {level.ageGroup}
                </Badge>
                <Text size="sm" c="dimmed">
                  Capacity {level.capacity} · {level.fee.formatted}
                </Text>
              </Group>
              <Text size="sm" c="dimmed">
                New class · {days.length} {days.length === 1 ? 'day' : 'days'}
              </Text>
            </Group>

            <input type="hidden" name="levelId" value={level.id} />

            <TextInput
              label="Base class name"
              placeholder="each day is its own class; set its curriculum below"
              value={baseName}
              onChange={(event) => changeBaseName(event.currentTarget.value)}
            />

            {days.map((day, index) => {
              const stage = stages.find((candidate) => String(candidate.id) === day.levelStageId)
              const stageSkills = stage?.skills ?? []
              const selectedSkills = stageSkills.filter((skill) =>
                day.skillIds.includes(String(skill.id))
              )
              const prefix = `days[${index}]`

              return (
                <Card key={index} withBorder shadow="none" bg="white">
                  <Stack gap="sm">
                    <Group justify="space-between" align="center">
                      <Text fw={600}>{weekdayLabel(day.weekday)}</Text>
                      {days.length > 1 && (
                        <Tooltip label="Remove day">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            aria-label={`Remove day ${index + 1}`}
                            onClick={() => removeDay(index)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>

                    <Group gap="sm" align="flex-start">
                      <NativeSelect
                        label="Day"
                        flex={1}
                        value={day.weekday}
                        onChange={(event) => changeWeekday(index, event.currentTarget.value)}
                        data={WEEKDAYS}
                      />
                      <TextInput
                        label="Start time"
                        type="time"
                        w={130}
                        value={day.startTime}
                        onChange={(event) => setDay(index, { startTime: event.currentTarget.value })}
                        error={errors[`days.${index}.startTime`]}
                      />
                      <TextInput
                        label="Duration (mins)"
                        type="number"
                        w={130}
                        value={day.durationMinutes}
                        onChange={(event) =>
                          setDay(index, { durationMinutes: event.currentTarget.value })
                        }
                        error={errors[`days.${index}.durationMinutes`]}
                      />
                    </Group>

                    <TextInput
                      label="Class name"
                      value={day.name}
                      onChange={(event) =>
                        setDay(index, { name: event.currentTarget.value, nameTouched: true })
                      }
                      error={errors[`days.${index}.name`]}
                    />

                    <NativeSelect
                      label="Select stage"
                      value={day.levelStageId}
                      onChange={(event) =>
                        setDay(index, {
                          levelStageId: event.currentTarget.value,
                          skillIds: [],
                          activityIds: [],
                        })
                      }
                      data={stages.map((candidate) => ({
                        value: String(candidate.id),
                        label: candidate.name,
                      }))}
                    />

                    <MultiSelect
                      label="Select skills"
                      placeholder={day.skillIds.length === 0 ? 'Add a skill…' : undefined}
                      value={day.skillIds}
                      onChange={(skillIds) => {
                        const allowed = new Set(
                          stageSkills
                            .filter((skill) => skillIds.includes(String(skill.id)))
                            .flatMap((skill) => skill.activities.map((a) => String(a.id)))
                        )
                        setDay(index, {
                          skillIds,
                          activityIds: day.activityIds.filter((id) => allowed.has(id)),
                        })
                      }}
                      data={stageSkills.map((skill) => ({
                        value: String(skill.id),
                        label: skill.name,
                      }))}
                    />

                    {selectedSkills.length > 0 && (
                      <Stack gap="xs">
                        <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
                          Select activities
                        </Text>
                        {selectedSkills.map((skill) => (
                          <MultiSelect
                            key={skill.id}
                            label={skill.name}
                            placeholder={
                              day.activityIds.some((id) =>
                                skill.activities.some((a) => String(a.id) === id)
                              )
                                ? undefined
                                : 'Add activities…'
                            }
                            value={day.activityIds.filter((id) =>
                              skill.activities.some((a) => String(a.id) === id)
                            )}
                            onChange={(selected) => {
                              const others = day.activityIds.filter(
                                (id) => !skill.activities.some((a) => String(a.id) === id)
                              )
                              setDay(index, { activityIds: [...others, ...selected] })
                            }}
                            data={skill.activities.map((activity) => ({
                              value: String(activity.id),
                              label: activity.name,
                            }))}
                          />
                        ))}
                      </Stack>
                    )}

                    <input type="hidden" name={`${prefix}[weekday]`} value={day.weekday} />
                    <input type="hidden" name={`${prefix}[startTime]`} value={day.startTime} />
                    <input
                      type="hidden"
                      name={`${prefix}[durationMinutes]`}
                      value={day.durationMinutes}
                    />
                    <input type="hidden" name={`${prefix}[name]`} value={day.name} />
                    <input
                      type="hidden"
                      name={`${prefix}[levelStageId]`}
                      value={day.levelStageId}
                    />
                    {day.skillIds.map((id, skillIndex) => (
                      <input
                        key={`skill-${id}`}
                        type="hidden"
                        name={`${prefix}[skillIds][${skillIndex}]`}
                        value={id}
                      />
                    ))}
                    {day.activityIds.map((id, activityIndex) => (
                      <Fragment key={`activity-${id}`}>
                        <input
                          type="hidden"
                          name={`${prefix}[activityIds][${activityIndex}]`}
                          value={id}
                        />
                      </Fragment>
                    ))}
                  </Stack>
                </Card>
              )
            })}

            <Button
              type="button"
              variant="default"
              leftSection={<IconPlus size={14} />}
              onClick={addDay}
            >
              Add another day
            </Button>

            <Divider />

            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                Creates {days.length} {days.length === 1 ? 'class' : 'classes'} · each with its own
                curriculum and code
              </Text>
              <Group gap="sm">
                <Button type="button" variant="default" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" loading={processing}>
                  Create {days.length} {days.length === 1 ? 'class' : 'classes'}
                </Button>
              </Group>
            </Group>
          </Stack>
        )}
      </Form>
    </Card>
  )
}
