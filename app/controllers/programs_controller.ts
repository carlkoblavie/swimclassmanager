import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Invitation from '#models/invitation'
import Membership from '#models/membership'
import Organisation from '#models/organisation'
import Program from '#models/program'
import SwimYear from '#models/swim_year'
import SwimmingClass from '#models/swimming_class'
import { permissions } from '#start/permissions'
import BankPackService from '#services/bank_pack_service'
import ProgramAuthoringService from '#services/program_authoring_service'
import SkillBankFamilyService from '#services/skill_bank_family_service'
import SkillBankService from '#services/skill_bank_service'
import InvitationTransformer from '#transformers/invitation_transformer'
import MembershipTransformer from '#transformers/membership_transformer'
import ProgramTransformer from '#transformers/program_transformer'
import SwimYearTransformer from '#transformers/swim_year_transformer'
import SwimmingClassTransformer from '#transformers/swimming_class_transformer'
import { storeProgramValidator, updateProgramValidator } from '#validators/program'
import { RoleName } from '#values/role'

async function stageSkillOptions(
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

  return skills
    .filter((skill) => familyNames.has(skill.family))
    .map((skill) => ({
      id: skill.id,
      familyKey: skill.family,
      familyName: familyNames.get(skill.family)!,
      name: skill.name,
      description: skill.description,
      passCriteria: skill.passCriteria,
    }))
}

export default class ProgramsController {
  @inject()
  async index(
    { auth, inertia }: HttpContext,
    bank: SkillBankService,
    families: SkillBankFamilyService,
    packs: BankPackService
  ) {
    const user = auth.getUserOrFail()
    const schoolId = user.activeSchoolId!

    // Draft programs are hidden until active: only members with program.manage
    // see them (to prepare them for publishing).
    const membership = await Membership.query()
      .where('schoolId', schoolId)
      .where('userId', user.id)
      .first()
    const access = membership ? await permissions.createAccessFor(membership) : undefined
    const canManage = access?.allows('program.manage') ?? false

    const programs = await Program.query()
      .if(!canManage, (query) => query.withScopes((scopes) => scopes.active()))
      .preload('levels', (levelsQuery) =>
        levelsQuery
          .preload('schoolLevelSettings', (settingsQuery) =>
            settingsQuery.where('schoolId', schoolId)
          )
          .preload('stages', (stagesQuery) =>
            stagesQuery
              .preload('skills', (skillsQuery) => skillsQuery.preload('activities'))
              .orderBy('position')
          )
          .orderBy('id')
      )
      .orderBy('name')

    // Ongoing and upcoming swim years feed the class builder's term picker.
    const termYears = await SwimYear.query()
      .where('schoolId', schoolId)
      .where('endsOn', '>=', DateTime.now().toISODate()!)
      .preload('terms', (termsQuery) => termsQuery.orderBy('position'))
      .orderBy('startsOn')

    // Teachers and head coaches feed the builder's instructor picker.
    const instructorMemberships = await Membership.query()
      .where('schoolId', schoolId)
      .whereHas('roles', (rolesQuery) => {
        rolesQuery.whereIn('name', [RoleName.TEACHER, RoleName.HEAD_COACH])
      })
      .preload('user')
      .preload('roles')
      .orderBy('id')

    // Teachers who were invited but have not accepted yet are assignable too.
    const pendingInvitations = await Invitation.query()
      .where('schoolId', schoolId)
      .whereHas('role', (roleQuery) => roleQuery.where('name', RoleName.TEACHER))
      .whereNull('acceptedAt')
      .orderBy('id')

    return inertia.render('programs/index', {
      programs: ProgramTransformer.transform(programs, schoolId),
      termOptions: SwimYearTransformer.transform(termYears),
      instructorOptions: MembershipTransformer.transform(instructorMemberships),
      pendingInstructorOptions: InvitationTransformer.transform(pendingInvitations),
      skillBankSkills: await stageSkillOptions(schoolId, bank, families, packs),
    })
  }

  @inject()
  async create(
    { auth, inertia }: HttpContext,
    bank: SkillBankService,
    families: SkillBankFamilyService,
    packs: BankPackService
  ) {
    const schoolId = auth.getUserOrFail().activeSchoolId!

    return inertia.render('programs/create', {
      skillBankSkills: await stageSkillOptions(schoolId, bank, families, packs),
    })
  }

  async show({ params, auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const schoolId = user.activeSchoolId!

    const membership = await Membership.query()
      .where('schoolId', schoolId)
      .where('userId', user.id)
      .first()
    const access = membership ? await permissions.createAccessFor(membership) : undefined
    const canManage = access?.allows('program.manage') ?? false
    const canViewClasses = access?.allows('class.view') ?? false

    // Draft programs stay hidden from members without program.manage.
    const program = await Program.query()
      .where('id', params.id)
      .if(!canManage, (query) => query.withScopes((scopes) => scopes.active()))
      .preload('levels', (levelsQuery) =>
        levelsQuery
          .preload('schoolLevelSettings', (settingsQuery) =>
            settingsQuery.where('schoolId', schoolId)
          )
          .preload('stages', (stagesQuery) =>
            stagesQuery
              .preload('skills', (skillsQuery) => skillsQuery.preload('activities'))
              .orderBy('position')
          )
          .orderBy('id')
      )
      .firstOrFail()

    const classes = canViewClasses
      ? await SwimmingClass.query()
          .where('schoolId', schoolId)
          .whereHas('level', (levelQuery) => levelQuery.where('programId', program.id))
          .preload('level', (levelQuery) => levelQuery.preload('program'))
          .preload('term', (termQuery) => termQuery.preload('swimYear'))
          .preload('levelStage')
          .preload('classInstructors', (instructorsQuery) =>
            instructorsQuery
              .preload('membership', (membershipQuery) => membershipQuery.preload('user'))
              .preload('invitation')
          )
          .preload('classSkills', (skillsQuery) => skillsQuery.preload('levelStageSkill'))
          .preload('lessons', (lessonsQuery) => lessonsQuery.orderBy('date'))
          .orderBy('weekday')
          .orderBy('startTime')
      : []

    const termYears = await SwimYear.query()
      .where('schoolId', schoolId)
      .where('endsOn', '>=', DateTime.now().toISODate()!)
      .preload('terms', (termsQuery) => termsQuery.orderBy('position'))
      .orderBy('startsOn')

    return inertia.render('programs/show', {
      program: ProgramTransformer.transform(program, schoolId),
      classes: SwimmingClassTransformer.transform(classes),
      termOptions: SwimYearTransformer.transform(termYears),
    })
  }

  @inject()
  async store(
    { auth, request, response, session }: HttpContext,
    authoring: ProgramAuthoringService
  ) {
    const user = auth.getUserOrFail()
    const organisation = await Organisation.findOrFail(user.activeOrganisationId!)
    const payload = await request.validateUsing(storeProgramValidator)
    const program = await authoring.create(payload, organisation.name, user.activeSchoolId!)

    // Programs are drafts until activated; publishing creates and activates in one step.
    if (request.input('intent') === 'publish') {
      await program.activate()
      session.flash('success', 'Program published.')
    } else {
      session.flash('success', 'Program created.')
    }

    return response.redirect().toRoute('programs.index')
  }

  @inject()
  async edit(
    { params, auth, inertia }: HttpContext,
    bank: SkillBankService,
    families: SkillBankFamilyService,
    packs: BankPackService
  ) {
    const schoolId = auth.getUserOrFail().activeSchoolId!

    const program = await Program.query()
      .where('id', params.id)
      .preload('levels', (levelsQuery) =>
        levelsQuery
          .preload('stages', (stagesQuery) =>
            stagesQuery
              .preload('skills', (skillsQuery) => skillsQuery.preload('activities'))
              .orderBy('position')
          )
          .orderBy('id')
      )
      .firstOrFail()

    return inertia.render('programs/edit', {
      program: ProgramTransformer.transform(program, schoolId).useVariant('forEdit'),
      skillBankSkills: await stageSkillOptions(schoolId, bank, families, packs),
    })
  }

  @inject()
  async update(
    { auth, params, request, response, session }: HttpContext,
    authoring: ProgramAuthoringService
  ) {
    const user = auth.getUserOrFail()
    const program = await Program.findOrFail(params.id)

    if (request.input('intent') === 'activate') {
      await program.activate()
      session.flash('success', 'Program activated.')
      return response.redirect().toRoute('programs.index')
    }

    const payload = await request.validateUsing(updateProgramValidator, {
      meta: { programId: program.id },
    })
    await authoring.update(program, payload, user.activeSchoolId!)

    session.flash('success', 'Program updated.')
    return response.redirect().toRoute('programs.index')
  }

  @inject()
  async destroy(
    { params, request, response, session }: HttpContext,
    authoring: ProgramAuthoringService
  ) {
    const program = await Program.findOrFail(params.id)

    // Destructive: deletes the program's levels, stages, classes, and
    // lessons. The client must echo the program name to confirm.
    const confirmName = String(request.input('confirmName') ?? '').trim()
    if (confirmName !== program.name) {
      session.flash('error', 'Type the program name exactly to confirm deletion.')
      return response.redirect().toRoute('programs.index')
    }

    await authoring.destroy(program)

    session.flash('success', `Program ${program.name} and everything under it removed.`)
    return response.redirect().toRoute('programs.index')
  }
}
