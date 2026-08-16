import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Invitation from '#models/invitation'
import Level from '#models/level'
import Membership from '#models/membership'
import School from '#models/school'
import SwimYear from '#models/swim_year'
import SwimmingClass from '#models/swimming_class'
import BankPackService from '#services/bank_pack_service'
import ClassSeriesAuthoringService from '#services/class_series_authoring_service'
import SchoolActivityBankService from '#services/school_activity_bank_service'
import SkillBankFamilyService from '#services/skill_bank_family_service'
import SkillBankService from '#services/skill_bank_service'
import { EnrollmentStatus } from '#values/enrollment_status'
import InvitationTransformer from '#transformers/invitation_transformer'
import LevelTransformer from '#transformers/level_transformer'
import MembershipTransformer from '#transformers/membership_transformer'
import SchoolActivityCategoryTransformer from '#transformers/school_activity_category_transformer'
import SwimYearTransformer from '#transformers/swim_year_transformer'
import SwimmingClassTransformer from '#transformers/swimming_class_transformer'
import {
  storeSwimmingClassesValidator,
  updateSwimmingClassValidator,
} from '#validators/swimming_class'
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

export default class SwimmingClassesController {
  /**
   * Display the school's day-based classes
   */
  async index({ auth, inertia }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const classes = await SwimmingClass.query()
      .where('schoolId', schoolId)
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
      .withCount('enrollments', (enrollmentsQuery) => {
        enrollmentsQuery.where('status', EnrollmentStatus.ACTIVE).as('enrolledCount')
      })
      .orderBy('levelStageId')
      .orderBy('name')

    return inertia.render('classes/index', {
      classes: SwimmingClassTransformer.transform(classes),
    })
  }

  /**
   * Create one class per submitted day (from the inline builder on programs)
   */
  @inject()
  async store(
    { auth, request, response, session }: HttpContext,
    authoring: ClassSeriesAuthoringService
  ) {
    const user = auth.getUserOrFail()
    const school = await School.findOrFail(user.activeSchoolId!)
    const payload = await request.validateUsing(storeSwimmingClassesValidator)

    const swimmingClass = await authoring.createOne(school, payload)

    session.flash(
      'success',
      payload.inviteTeacherEmail ? 'Class created. Instructor invited.' : 'Class created.'
    )
    if (payload.redirectTo === 'back') {
      return response.redirect().back()
    }
    return response.redirect().toRoute('levels.show', { id: swimmingClass.levelId })
  }

  /**
   * Show a class with its planned lessons
   */
  @inject()
  async show({ auth, inertia, params }: HttpContext, activityBank: SchoolActivityBankService) {
    const user = auth.getUserOrFail()
    const schoolId = user.activeSchoolId!
    const membership = await Membership.query()
      .where('schoolId', schoolId)
      .where('userId', user.id)
      .preload('roles')
      .first()
    const isInstructor = membership?.roles.some(
      (role) => role.name === RoleName.TEACHER || role.name === RoleName.ASSISTANT_COACH
    )
    const instructorMembershipId = isInstructor ? membership?.id : null
    const swimmingClass = await SwimmingClass.query()
      .where('id', params.id)
      .where('schoolId', schoolId)
      .preload('level', (levelQuery) => levelQuery.preload('program'))
      .preload('term', (termQuery) => termQuery.preload('swimYear'))
      .preload('levelStage', (stageQuery) =>
        stageQuery.preload('skills', (skillQuery) => skillQuery.preload('activities'))
      )
      .preload('classInstructors', (instructorsQuery) =>
        instructorsQuery
          .preload('membership', (membershipQuery) => membershipQuery.preload('user'))
          .preload('invitation')
      )
      .preload('classSkills', (skillsQuery) =>
        skillsQuery
          .preload('skillBankSkill')
          .preload('levelStageSkill', (skillQuery) => skillQuery.preload('activities'))
      )
      .preload('lessons', (lessonsQuery) =>
        (instructorMembershipId
          ? lessonsQuery.whereHas('lessonInstructors', (instructorsQuery) =>
              instructorsQuery.where('membershipId', instructorMembershipId)
            )
          : lessonsQuery
        )
          .preload('lessonActivities', (activitiesQuery) =>
            activitiesQuery
              .preload('levelStageActivity')
              .preload('schoolActivity', (activityQuery) => activityQuery.preload('category'))
              .orderBy('position')
          )
          .preload('lessonInstructors', (instructorsQuery) =>
            instructorsQuery
              .preload('membership', (membershipQuery) => membershipQuery.preload('user'))
              .preload('invitation')
          )
          .orderBy('date')
      )
      .firstOrFail()
    const bank = await activityBank.forSchool(
      schoolId,
      swimmingClass.classSkills.length > 0
        ? activityBank.scopeFromClassSkills(
            swimmingClass.levelId,
            swimmingClass.levelStageId,
            swimmingClass.classSkills
          )
        : activityBank.scopeFromCurriculumSkills(
            swimmingClass.levelId,
            swimmingClass.levelStageId,
            swimmingClass.levelStage?.skills ?? []
          )
    )

    return inertia.render('classes/show', {
      swimmingClass: SwimmingClassTransformer.transform(swimmingClass),
      activityBank: SchoolActivityCategoryTransformer.transform(bank),
    })
  }

  /**
   * Edit a class: schedule, name, location, and instructor
   */
  @inject()
  async edit(
    { auth, inertia, params }: HttpContext,
    bank: SkillBankService,
    families: SkillBankFamilyService,
    packs: BankPackService
  ) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const swimmingClass = await SwimmingClass.query()
      .where('id', params.id)
      .where('schoolId', schoolId)
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
      .firstOrFail()

    // Stage and skill pickers need the level's curriculum tree.
    const level = await Level.query()
      .where('id', swimmingClass.levelId)
      .preload('program')
      .preload('schoolLevelSettings', (settingsQuery) => settingsQuery.where('schoolId', schoolId))
      .preload('stages', (stagesQuery) =>
        stagesQuery
          .preload('skills', (skillsQuery) => skillsQuery.preload('activities'))
          .orderBy('position')
      )
      .firstOrFail()

    const instructorMemberships = await Membership.query()
      .where('schoolId', schoolId)
      .whereHas('roles', (rolesQuery) => {
        rolesQuery.whereIn('name', [
          RoleName.TEACHER,
          RoleName.ASSISTANT_COACH,
          RoleName.HEAD_COACH,
        ])
      })
      .preload('user')
      .preload('roles')
      .orderBy('id')

    // Teachers who were invited but have not accepted yet are assignable too.
    const pendingInvitations = await Invitation.query()
      .where('schoolId', schoolId)
      .whereHas('role', (roleQuery) =>
        roleQuery.whereIn('name', [RoleName.TEACHER, RoleName.ASSISTANT_COACH])
      )
      .whereNull('acceptedAt')
      .orderBy('id')

    // Ongoing and upcoming swim years for the term picker; the class's own
    // (possibly archived) year is included so its term stays selectable.
    const termYears = await SwimYear.query()
      .where('schoolId', schoolId)
      .where((query) => {
        query.where('endsOn', '>=', DateTime.now().toISODate()!)
        if (swimmingClass.termId) {
          query.orWhereHas('terms', (termsQuery) => termsQuery.where('id', swimmingClass.termId!))
        }
      })
      .preload('terms', (termsQuery) => termsQuery.orderBy('position'))
      .orderBy('startsOn')

    return inertia.render('classes/edit', {
      swimmingClass: SwimmingClassTransformer.transform(swimmingClass),
      level: LevelTransformer.transform(level, schoolId),
      instructorOptions: MembershipTransformer.transform(instructorMemberships),
      pendingInstructorOptions: InvitationTransformer.transform(pendingInvitations),
      termOptions: SwimYearTransformer.transform(termYears),
      skillBankSkills: await classSkillOptions(schoolId, bank, families, packs),
    })
  }

  /**
   * Update or cancel a class
   */
  @inject()
  async update(
    { auth, request, response, params, session }: HttpContext,
    authoring: ClassSeriesAuthoringService
  ) {
    const user = auth.getUserOrFail()
    const school = await School.findOrFail(user.activeSchoolId!)
    const swimmingClass = await SwimmingClass.query()
      .where('id', params.id)
      .where('schoolId', school.id)
      .firstOrFail()

    if (request.input('intent') === 'cancel') {
      await authoring.cancel(swimmingClass)
      session.flash('success', 'Class cancelled.')
      if (request.input('redirectTo') === 'back') {
        return response.redirect().back()
      }
      return response.redirect().toRoute('levels.show', { id: swimmingClass.levelId })
    }

    const payload = await request.validateUsing(updateSwimmingClassValidator)
    await authoring.update(swimmingClass, school, payload)

    session.flash(
      'success',
      payload.inviteTeacherEmail ? 'Class updated. Instructor invited.' : 'Class updated.'
    )
    if (payload.redirectTo === 'back') {
      return response.redirect().back()
    }
    return response.redirect().toRoute('levels.show', { id: swimmingClass.levelId })
  }

  /**
   * Duplicate a class into the same stage
   */
  @inject()
  async duplicate(
    { auth, response, params, session }: HttpContext,
    authoring: ClassSeriesAuthoringService
  ) {
    const user = auth.getUserOrFail()
    const school = await School.findOrFail(user.activeSchoolId!)
    const swimmingClass = await SwimmingClass.query()
      .where('id', params.id)
      .where('schoolId', school.id)
      .firstOrFail()

    const copy = await authoring.duplicate(swimmingClass, school)
    session.flash('success', 'Class duplicated.')
    return response.redirect().toRoute('levels.show', { id: copy.levelId })
  }
}
