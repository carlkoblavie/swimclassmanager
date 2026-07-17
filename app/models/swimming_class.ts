import { DateTime } from 'luxon'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { SwimmingClassSchema } from '#database/schema'
import School from '#models/school'
import Level from '#models/level'
import LevelStage from '#models/level_stage'
import Membership from '#models/membership'
import Invitation from '#models/invitation'
import ClassLesson from '#models/class_lesson'
import ClassSkill from '#models/class_skill'
import Term from '#models/term'

export default class SwimmingClass extends SwimmingClassSchema {
  @belongsTo(() => Term)
  declare term: BelongsTo<typeof Term>

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

  @hasMany(() => ClassLesson)
  declare lessons: HasMany<typeof ClassLesson>

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
