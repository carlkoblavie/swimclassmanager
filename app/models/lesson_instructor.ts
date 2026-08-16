import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { LessonInstructorSchema } from '#database/schema'
import ClassLesson from '#models/class_lesson'
import Invitation from '#models/invitation'
import Membership from '#models/membership'

export default class LessonInstructor extends LessonInstructorSchema {
  @belongsTo(() => ClassLesson)
  declare classLesson: BelongsTo<typeof ClassLesson>

  @belongsTo(() => Membership)
  declare membership: BelongsTo<typeof Membership>

  @belongsTo(() => Invitation)
  declare invitation: BelongsTo<typeof Invitation>
}
