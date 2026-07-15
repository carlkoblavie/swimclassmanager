import type { DateTime } from 'luxon'

export type ClassScheduleInput = {
  startDate: DateTime
  endDate: DateTime
  weekdays: number[]
  startTime: string
  endTime: string
}

export type ClassSessionDraft = {
  startsAt: DateTime
  endsAt: DateTime
}

function applyTime(date: DateTime, time: string): DateTime {
  const [hour, minute] = time.split(':').map(Number)
  return date.set({ hour, minute, second: 0, millisecond: 0 })
}

export default class ClassScheduleGenerationService {
  generate(data: ClassScheduleInput): ClassSessionDraft[] {
    const weekdaySet = new Set(data.weekdays)
    const sessions: ClassSessionDraft[] = []

    for (
      let current = data.startDate.startOf('day');
      current <= data.endDate.startOf('day');
      current = current.plus({ days: 1 })
    ) {
      if (!weekdaySet.has(current.weekday)) {
        continue
      }

      sessions.push({
        startsAt: applyTime(current, data.startTime),
        endsAt: applyTime(current, data.endTime),
      })
    }

    return sessions
  }
}
