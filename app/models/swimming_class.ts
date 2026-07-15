import { DateTime } from 'luxon'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { SwimmingClassSchema } from '#database/schema'
import School from '#models/school'
import Level from '#models/level'
import Membership from '#models/membership'
import Invitation from '#models/invitation'
import SwimmingClassWeekday from '#models/swimming_class_weekday'
import SwimmingClassSession from '#models/swimming_class_session'
import ClassStage from '#models/class_stage'

export default class SwimmingClass extends SwimmingClassSchema {
  @belongsTo(() => School)
  declare school: BelongsTo<typeof School>

  @belongsTo(() => Level)
  declare level: BelongsTo<typeof Level>

  @belongsTo(() => Membership, { foreignKey: 'instructorMembershipId' })
  declare instructorMembership: BelongsTo<typeof Membership>

  @belongsTo(() => Invitation, { foreignKey: 'pendingInstructorInvitationId' })
  declare pendingInstructorInvitation: BelongsTo<typeof Invitation>

  @hasMany(() => SwimmingClassWeekday)
  declare weekdays: HasMany<typeof SwimmingClassWeekday>

  @hasMany(() => SwimmingClassSession)
  declare sessions: HasMany<typeof SwimmingClassSession>

  @hasMany(() => ClassStage)
  declare stages: HasMany<typeof ClassStage>

  get isCancelled(): boolean {
    return this.cancelledAt !== null
  }

  get hasPendingInstructor(): boolean {
    return this.pendingInstructorInvitationId !== null && this.instructorMembershipId === null
  }

  cancel() {
    this.cancelledAt = DateTime.now()
  }
}
