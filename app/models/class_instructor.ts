import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { ClassInstructorSchema } from '#database/schema'
import Invitation from '#models/invitation'
import Membership from '#models/membership'
import SwimmingClass from '#models/swimming_class'

/**
 * One instructor on a class: either an accepted membership or a pending
 * teacher invitation (exactly one is set). Accepting the invitation converts
 * the row to a membership.
 */
export default class ClassInstructor extends ClassInstructorSchema {
  @belongsTo(() => SwimmingClass)
  declare swimmingClass: BelongsTo<typeof SwimmingClass>

  @belongsTo(() => Membership)
  declare membership: BelongsTo<typeof Membership>

  @belongsTo(() => Invitation)
  declare invitation: BelongsTo<typeof Invitation>
}
