import vine from '@vinejs/vine'
import { ATTENDANCE_STATUS_VALUES } from '#values/attendance_status'

export const saveAttendanceValidator = vine.create({
  marks: vine
    .array(
      vine.object({
        learnerId: vine.number().withoutDecimals().positive(),
        status: vine.enum(ATTENDANCE_STATUS_VALUES),
      })
    )
    .maxLength(500),
})
