import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Invitation from '#models/invitation'
import Level from '#models/level'
import Membership from '#models/membership'
import SwimYear from '#models/swim_year'
import SwimmingClass from '#models/swimming_class'
import { permissions } from '#start/permissions'
import BankPackService from '#services/bank_pack_service'
import SkillBankFamilyService from '#services/skill_bank_family_service'
import SkillBankService from '#services/skill_bank_service'
import InvitationTransformer from '#transformers/invitation_transformer'
import LevelTransformer from '#transformers/level_transformer'
import MembershipTransformer from '#transformers/membership_transformer'
import SwimYearTransformer from '#transformers/swim_year_transformer'
import SwimmingClassTransformer from '#transformers/swimming_class_transformer'
import { RoleName } from '#values/role'

async function classSkillOptions(
  schoolId: number,
  bank: SkillBankService,
  families: SkillBankFamilyService,
  packs: BankPackService
) {
  await packs.syncEnabledPacks(schoolId)
  const [skills, schoolFamilies] = await Promise.all([
    bank.forSchool(schoolId),
    families.forSchool(schoolId),
  ])
  const familyNames = new Map(
    schoolFamilies.map((family) => [family.familyKey, family.displayName])
  )

  return skills.map((skill) => ({
    id: skill.id,
    sourceKey: skill.sourceKey,
    familyKey: skill.family,
    familyName: familyNames.get(skill.family) ?? skill.family,
    name: skill.name,
    description: skill.description,
    passCriteria: skill.passCriteria,
  }))
}

export default class LevelsController {
  @inject()
  async show(
    { auth, inertia, params }: HttpContext,
    bank: SkillBankService,
    families: SkillBankFamilyService,
    packs: BankPackService
  ) {
    const user = auth.getUserOrFail()
    const schoolId = user.activeSchoolId!

    const membership = await Membership.query()
      .where('schoolId', schoolId)
      .where('userId', user.id)
      .first()
    const access = membership ? await permissions.createAccessFor(membership) : undefined
    const canManage = access?.allows('program.manage') ?? false
    const canViewClasses = access?.allows('class.view') ?? false
    const canManageClasses = access?.allows('class.manage') ?? false

    // Levels of draft programs stay hidden until the program is active,
    // matching the programs list.
    const level = await Level.query()
      .where('id', params.id)
      .if(!canManage, (query) =>
        query.whereHas('program', (programQuery) => programQuery.whereNotNull('activatedAt'))
      )
      .preload('program')
      .preload('schoolLevelSettings', (settingsQuery) => settingsQuery.where('schoolId', schoolId))
      .preload('stages', (stagesQuery) =>
        stagesQuery
          .preload('skills', (skillsQuery) => skillsQuery.preload('activities'))
          .orderBy('position')
      )
      .firstOrFail()

    const classes = canViewClasses
      ? await SwimmingClass.query()
          .where('schoolId', schoolId)
          .where('levelId', level.id)
          .preload('level', (levelQuery) => levelQuery.preload('program'))
          .preload('term', (termQuery) => termQuery.preload('swimYear'))
          .preload('levelStage')
          .preload('classInstructors', (instructorsQuery) =>
            instructorsQuery
              .preload('membership', (membershipQuery) => membershipQuery.preload('user'))
              .preload('invitation')
          )
          .preload('classSkills', (skillsQuery) =>
            skillsQuery.preload('skillBankSkill').preload('levelStageSkill')
          )
          .preload('lessons', (lessonsQuery) => lessonsQuery.orderBy('date'))
          .orderBy('levelStageId')
          .orderBy('name')
      : []

    // Options for the "New class" form (only needed by class managers).
    const instructorMemberships = canManageClasses
      ? await Membership.query()
          .where('schoolId', schoolId)
          .whereHas('roles', (rolesQuery) => {
            rolesQuery.whereIn('name', [RoleName.TEACHER, RoleName.HEAD_COACH])
          })
          .preload('user')
          .preload('roles')
          .orderBy('id')
      : []

    const pendingInvitations = canManageClasses
      ? await Invitation.query()
          .where('schoolId', schoolId)
          .whereHas('role', (roleQuery) => roleQuery.where('name', RoleName.TEACHER))
          .whereNull('acceptedAt')
          .orderBy('id')
      : []

    const termYears = canManageClasses
      ? await SwimYear.query()
          .where('schoolId', schoolId)
          .where('endsOn', '>=', DateTime.now().toISODate()!)
          .preload('terms', (termsQuery) => termsQuery.orderBy('position'))
          .orderBy('startsOn')
      : []

    return inertia.render('levels/show', {
      level: LevelTransformer.transform(level, schoolId).useVariant('forClassOption'),
      classes: SwimmingClassTransformer.transform(classes),
      canManageClasses,
      instructorOptions: MembershipTransformer.transform(instructorMemberships),
      pendingInstructorOptions: InvitationTransformer.transform(pendingInvitations),
      termOptions: SwimYearTransformer.transform(termYears),
      skillBankSkills: canManageClasses
        ? await classSkillOptions(schoolId, bank, families, packs)
        : [],
    })
  }
}
