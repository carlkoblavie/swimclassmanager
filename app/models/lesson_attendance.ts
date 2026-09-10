import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { LessonAttendanceSchema } from '#database/schema'
import ClassLesson from '#models/class_lesson'
import Learner from '#models/learner'

/** One learner's attendance mark (present/late/absent) for a lesson. */
export default class LessonAttendance extends LessonAttendanceSchema {
  @belongsTo(() => ClassLesson)
  declare classLesson: BelongsTo<typeof ClassLesson>

  @belongsTo(() => Learner)
  declare learner: BelongsTo<typeof Learner>
}
