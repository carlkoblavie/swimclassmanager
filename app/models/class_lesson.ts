import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { ClassLessonSchema } from '#database/schema'
import SwimmingClass from '#models/swimming_class'
import LessonActivity from '#models/lesson_activity'

export default class ClassLesson extends ClassLessonSchema {
  @belongsTo(() => SwimmingClass)
  declare swimmingClass: BelongsTo<typeof SwimmingClass>

  @hasMany(() => LessonActivity)
  declare lessonActivities: HasMany<typeof LessonActivity>
}
