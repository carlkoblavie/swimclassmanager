import { useEffect, useRef, useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Collapse,
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
import { Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import { Guard } from '~/utils/permissions'
import InstructorPicker, { type InstructorMode } from '~/components/instructor_picker'
import { nextWeekdayDate } from '~/components/plan_lesson_form'

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
  lessonDate: string
  dateTouched: boolean
  levelStageId: string
  skillIds: string[]
}

function autoName(baseName: string, levelName: string, weekday: string): string {
  const base = baseName.trim() || levelName
  return `${base} — ${weekdayLabel(weekday)}`
}

export default function ClassInlineBuilder({
  level,
  termOptions,
  instructorOptions,
  onClose,
}: {
  level: Data.Level
  termOptions: Data.SwimYear[]
  instructorOptions: Data.Membership[]
  onClose: () => void
}) {
  const stages = level.stages ?? []
  const [instructorMode, setInstructorMode] = useState<InstructorMode>('none')

  // Flatten swim years into selectable terms; new classes must pick one.
  const terms = termOptions.flatMap((swimYear) =>
    swimYear.terms.map((term) => ({ ...term, swimYearName: swimYear.name }))
  )
  const todayIso = new Date().toISOString().slice(0, 10)
  const defaultTerm =
    terms.find((term) => term.startsOn.raw <= todayIso && todayIso <= term.endsOn.raw) ??
    terms.find((term) => term.startsOn.raw > todayIso) ??
    terms[0]
  const [termId, setTermId] = useState(defaultTerm ? String(defaultTerm.id) : '')

  // First lesson dates anchor at the term start when it lies in the future.
  const anchorForTerm = (term?: (typeof terms)[number]): Date => {
    const today = new Date()
    if (!term) {
      return today
    }
    const start = new Date(term.startsOn.raw)
    start.setDate(start.getDate() - 1)
    return start > today ? start : today
  }
  const lessonAnchor = () => anchorForTerm(terms.find((term) => String(term.id) === termId))

  // Mount closed, then open so the form slides in; once fully expanded,
  // scroll the form header to the top of the viewport, clearing the fixed app header.
  const headerRef = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setRevealed(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const scrollToForm = () => {
    headerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollAnchorProps = {
    ref: headerRef,
    style: { scrollMarginTop: 76 },
  }

  const newDay = (baseName: string, weekday = '1'): DayDraft => ({
    weekday,
    startTime: '17:00',
    durationMinutes: '45',
    name: autoName(baseName, level.name, weekday),
    nameTouched: false,
    lessonDate: nextWeekdayDate(Number(weekday), lessonAnchor()),
    dateTouched: false,
    levelStageId: stages[0] ? String(stages[0].id) : '',
    skillIds: [],
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
              lessonDate: day.dateTouched
                ? day.lessonDate
                : nextWeekdayDate(Number(weekday), lessonAnchor()),
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

  const removeDay = (index: number) => setDays((current) => current.filter((_, i) => i !== index))

  const changeTerm = (value: string) => {
    setTermId(value)
    const anchor = anchorForTerm(terms.find((term) => String(term.id) === value))
    setDays((current) =>
      current.map((day) =>
        day.dateTouched ? day : { ...day, lessonDate: nextWeekdayDate(Number(day.weekday), anchor) }
      )
    )
  }

  if (stages.length === 0 || terms.length === 0) {
    return (
      <Collapse expanded={revealed} transitionDuration={250} onTransitionEnd={scrollToForm}>
        <Card shadow="none">
          <Group justify="space-between" {...scrollAnchorProps}>
            <Text size="sm">
              {stages.length === 0
                ? 'This level has no stages yet — add curriculum to the program before scheduling classes.'
                : 'Classes belong to a term — create a swim year with terms in Settings first.'}
            </Text>
            <Group gap="xs">
              {stages.length > 0 && (
                <Guard for="settings.manage">
                  <Button component={Link} route="swim_years.index" size="xs" variant="light">
                    Open settings
                  </Button>
                </Guard>
              )}
              <Button type="button" variant="default" size="xs" onClick={onClose}>
                Close
              </Button>
            </Group>
          </Group>
        </Card>
      </Collapse>
    )
  }

  return (
    <Collapse expanded={revealed} transitionDuration={250} onTransitionEnd={scrollToForm}>
      <Card shadow="none">
        <Form route="swimming_classes.store" onSuccess={onClose}>
          {({ errors, processing }) => (
            <Stack gap="sm">
              <Group justify="space-between" align="center" {...scrollAnchorProps}>
                <Group gap="xs">
                  <Text fw={700}>{level.name}</Text>
                  <Badge variant="light" size="sm">
                    {level.ageGroup}
                  </Badge>
                  <Text size="sm" c="dimmed">
                    {typeof level.capacity === 'number' && `Capacity ${level.capacity} · `}
                    {level.fee.formatted}
                  </Text>
                </Group>
                <Text size="sm" c="dimmed">
                  New class · {days.length} {days.length === 1 ? 'day' : 'days'}
                </Text>
              </Group>

              <input type="hidden" name="levelId" value={level.id} />
              <input type="hidden" name="termId" value={termId} />

              <Group gap="sm" align="flex-start">
                <TextInput
                  label="Base class name"
                  placeholder="each day is its own class; set its curriculum below"
                  flex={1}
                  value={baseName}
                  onChange={(event) => changeBaseName(event.currentTarget.value)}
                />
                <NativeSelect
                  label="Term"
                  w={300}
                  value={termId}
                  onChange={(event) => changeTerm(event.currentTarget.value)}
                  error={errors.termId}
                  data={terms.map((term) => ({
                    value: String(term.id),
                    label: `${term.swimYearName} · ${term.name} (${term.startsOn.formatted} – ${term.endsOn.formatted})`,
                  }))}
                />
              </Group>

              {/* One instructor selection applies to every class created below. */}
              <InstructorPicker
                mode={instructorMode}
                onModeChange={setInstructorMode}
                instructorOptions={instructorOptions}
                errors={errors}
              />

              {days.map((day, index) => {
                const prefix = `days[${index}]`
                const stage = stages.find((candidate) => String(candidate.id) === day.levelStageId)
                const stageSkills = stage?.skills ?? []

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
                          onChange={(event) =>
                            setDay(index, { startTime: event.currentTarget.value })
                          }
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
                          setDay(index, { levelStageId: event.currentTarget.value, skillIds: [] })
                        }
                        data={stages.map((candidate) => ({
                          value: String(candidate.id),
                          label: candidate.name,
                        }))}
                      />

                      <MultiSelect
                        label="Select skills"
                        value={day.skillIds}
                        onChange={(skillIds) => setDay(index, { skillIds })}
                        data={stageSkills.map((skill) => ({
                          value: String(skill.id),
                          label: skill.name,
                        }))}
                      />

                      <Group gap="sm" align="flex-start">
                        <TextInput
                          label="First lesson date"
                          type="date"
                          w={170}
                          value={day.lessonDate}
                          onChange={(event) =>
                            setDay(index, {
                              lessonDate: event.currentTarget.value,
                              dateTouched: true,
                            })
                          }
                          error={errors[`days.${index}.lessonDate`]}
                        />
                      </Group>

                      <input type="hidden" name={`${prefix}[weekday]`} value={day.weekday} />
                      <input type="hidden" name={`${prefix}[startTime]`} value={day.startTime} />
                      <input
                        type="hidden"
                        name={`${prefix}[durationMinutes]`}
                        value={day.durationMinutes}
                      />
                      <input type="hidden" name={`${prefix}[name]`} value={day.name} />
                      <input type="hidden" name={`${prefix}[lessonDate]`} value={day.lessonDate} />
                      <input
                        type="hidden"
                        name={`${prefix}[levelStageId]`}
                        value={day.levelStageId}
                      />
                      {day.skillIds.map((id, skillIndex) => (
                        <input
                          key={id}
                          type="hidden"
                          name={`${prefix}[skillIds][${skillIndex}]`}
                          value={id}
                        />
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
                  Creates {days.length} {days.length === 1 ? 'class' : 'classes'} · each with its
                  own curriculum and code
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
    </Collapse>
  )
}
