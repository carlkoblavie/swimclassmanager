import { DateTime } from 'luxon'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { SwimmingClassSchema } from '#database/schema'
import School from '#models/school'
import Level from '#models/level'
import LevelStage from '#models/level_stage'
import Membership from '#models/membership'
import Invitation from '#models/invitation'
import ClassSkill from '#models/class_skill'
import ClassActivity from '#models/class_activity'

export default class SwimmingClass extends SwimmingClassSchema {
  @belongsTo(() => School)
  declare school: BelongsTo<typeof School>

  @belongsTo(() => Level)
  declare level: BelongsTo<typeof Level>

  @belongsTo(() => LevelStage)
  declare levelStage: BelongsTo<typeof LevelStage>

  @belongsTo(() => Membership, { foreignKey: 'instructorMembershipId' })
  declare instructorMembership: BelongsTo<typeof Membership>

  @belongsTo(() => Invitation, { foreignKey: 'pendingInstructorInvitationId' })
  declare pendingInstructorInvitation: BelongsTo<typeof Invitation>

  @hasMany(() => ClassSkill)
  declare classSkills: HasMany<typeof ClassSkill>

  @hasMany(() => ClassActivity)
  declare classActivities: HasMany<typeof ClassActivity>

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
