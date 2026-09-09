import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { ClassLessonSchema } from '#database/schema'
import SwimmingClass from '#models/swimming_class'
import LessonActivity from '#models/lesson_activity'
import Enrollment from '#models/enrollment'

export default class ClassLesson extends ClassLessonSchema {
  @belongsTo(() => SwimmingClass)
  declare swimmingClass: BelongsTo<typeof SwimmingClass>

  @hasMany(() => LessonActivity)
  declare lessonActivities: HasMany<typeof LessonActivity>

  @manyToMany(() => Enrollment, {
    pivotTable: 'enrollment_lessons',
    pivotForeignKey: 'class_lesson_id',
    pivotRelatedForeignKey: 'enrollment_id',
    pivotTimestamps: true,
  })
  declare enrollments: ManyToMany<typeof Enrollment>
}
