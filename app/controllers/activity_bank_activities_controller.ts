import db from '@adonisjs/lucid/services/db'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SchoolActivity from '#models/school_activity'
import BankPackService from '#services/bank_pack_service'
import SchoolActivityBankService from '#services/school_activity_bank_service'
import SchoolAgeGroupService from '#services/school_age_group_service'
import SkillBankFamilyService from '#services/skill_bank_family_service'
import SkillBankService from '#services/skill_bank_service'
import SchoolActivityCategoryTransformer from '#transformers/school_activity_category_transformer'
import { lessonActivityLeaderLabel } from '#values/lesson_activity_leader'
import { storeSchoolActivityValidator, updateSchoolActivityValidator } from '#validators/bank'

type ActivityPayload = Awaited<ReturnType<typeof storeSchoolActivityValidator.validate>>

async function nextActivityPosition(categoryId: number) {
  const total = await SchoolActivity.query()
    .where('schoolActivityCategoryId', categoryId)
    .count('* as total')

  return Number(total[0].$extras.total) + 1
}

async function syncActivityTags(
  activity: SchoolActivity,
  payload: Pick<ActivityPayload, 'ageGroupIds' | 'skillBankSkillIds'>
) {
  const ageGroupIds = payload.ageGroupIds ?? []
  const skillBankSkillIds = payload.skillBankSkillIds ?? []

  await db.from('school_activity_age_groups').where('school_activity_id', activity.id).delete()
  await db
    .from('school_activity_skill_bank_skills')
    .where('school_activity_id', activity.id)
    .delete()

  if (ageGroupIds.length > 0) {
    await db.table('school_activity_age_groups').multiInsert(
      ageGroupIds.map((schoolAgeGroupId) => ({
        school_activity_id: activity.id,
        school_age_group_id: schoolAgeGroupId,
      }))
    )
  }

  if (skillBankSkillIds.length > 0) {
    await db.table('school_activity_skill_bank_skills').multiInsert(
      skillBankSkillIds.map((skillBankSkillId) => ({
        school_activity_id: activity.id,
        skill_bank_skill_id: skillBankSkillId,
      }))
    )
  }
}

async function assertActivityTagsBelongToBank(
  schoolId: number,
  payload: Pick<ActivityPayload, 'ageGroupIds' | 'skillBankSkillIds'>
) {
  const ageGroupIds = payload.ageGroupIds ?? []
  const skillBankSkillIds = payload.skillBankSkillIds ?? []

  if (ageGroupIds.length > 0) {
    const validAgeGroups = await db
      .from('school_age_groups')
      .where('school_id', schoolId)
      .whereIn('id', ageGroupIds)
      .select('id')
    if (validAgeGroups.length !== ageGroupIds.length) {
      throw new Error('Choose age groups from this school.')
    }
  }

  if (skillBankSkillIds.length > 0) {
    const activeFamilies = await db
      .from('school_skill_bank_families')
      .where('school_id', schoolId)
      .where('is_active', true)
      .select('family_key')
    const activeFamilyKeys = activeFamilies.map((family) => String(family.family_key))
    const validSkills = await db
      .from('skill_bank_skills')
      .where((query) => query.whereNull('school_id').orWhere('school_id', schoolId))
      .where('is_active', true)
      .whereIn('family', activeFamilyKeys)
      .whereIn('id', skillBankSkillIds)
      .select('id')
    if (validSkills.length !== skillBankSkillIds.length) {
      throw new Error('Choose skills from this school skill bank.')
    }
  }
}

export default class ActivityBankActivitiesController {
  @inject()
  async index(
    { auth, inertia }: HttpContext,
    activityBank: SchoolActivityBankService,
    ageGroups: SchoolAgeGroupService,
    skills: SkillBankService,
    families: SkillBankFamilyService,
    packs: BankPackService
  ) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    await packs.syncEnabledPacks(schoolId)
    const [categories, schoolAgeGroups, skillBankSkills, skillFamilies] = await Promise.all([
      activityBank.forSchool(schoolId),
      ageGroups.forSchool(schoolId),
      skills.forSchool(schoolId),
      families.forSchool(schoolId),
    ])
    const skillFamilyLabels = new Map(
      skillFamilies.map((family) => [family.familyKey, family.displayName])
    )
    const activeFamilyKeys = new Set(skillFamilies.map((family) => family.familyKey))
    const visibleSkillBankSkills = skillBankSkills.filter((skill) =>
      activeFamilyKeys.has(skill.family)
    )

    const activityIds = categories.flatMap((category) =>
      category.activities.map((activity) => activity.id)
    )
    const [ageTags, skillTags] =
      activityIds.length > 0
        ? await Promise.all([
            db
              .from('school_activity_age_groups')
              .whereIn('school_activity_id', activityIds)
              .select('school_activity_id', 'school_age_group_id'),
            db
              .from('school_activity_skill_bank_skills')
              .whereIn('school_activity_id', activityIds)
              .select('school_activity_id', 'skill_bank_skill_id'),
          ])
        : [[], []]

    const ageTagsByActivity = new Map<number, number[]>()
    const skillTagsByActivity = new Map<number, number[]>()
    for (const row of ageTags) {
      const activityId = Number(row.school_activity_id)
      ageTagsByActivity.set(activityId, [
        ...(ageTagsByActivity.get(activityId) ?? []),
        Number(row.school_age_group_id),
      ])
    }
    for (const row of skillTags) {
      const activityId = Number(row.school_activity_id)
      skillTagsByActivity.set(activityId, [
        ...(skillTagsByActivity.get(activityId) ?? []),
        Number(row.skill_bank_skill_id),
      ])
    }

    return inertia.render('banks/activities', {
      categories: SchoolActivityCategoryTransformer.transform(categories),
      ageGroups: schoolAgeGroups.map((group) => ({
        id: group.id,
        displayName: group.displayName,
        minAgeYear: group.minAgeYear,
        maxAgeYear: group.maxAgeYear,
        position: group.position,
      })),
      skills: visibleSkillBankSkills.map((skill) => ({
        id: skill.id,
        family: skillFamilyLabels.get(skill.family) ?? skill.family,
        name: skill.name,
        sourceType: skill.sourceType,
      })),
      activityTags: Object.fromEntries(
        activityIds.map((id) => [
          id,
          {
            ageGroupIds: ageTagsByActivity.get(id) ?? [],
            skillBankSkillIds: skillTagsByActivity.get(id) ?? [],
          },
        ])
      ),
      leaderOptions: [1, 2, 3].map((value) => ({
        value,
        label: lessonActivityLeaderLabel(value as 1 | 2 | 3),
      })),
    })
  }

  async store({ auth, request, response, session }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const payload = await request.validateUsing(storeSchoolActivityValidator)

    const category = await db
      .from('school_activity_categories')
      .where('id', payload.schoolActivityCategoryId)
      .where('school_id', schoolId)
      .first()
    if (!category) {
      session.flash('error', 'Choose a category from this school.')
      return response.redirect().back()
    }
    await assertActivityTagsBelongToBank(schoolId, payload)

    const activity = await SchoolActivity.create({
      schoolId,
      schoolActivityCategoryId: payload.schoolActivityCategoryId,
      name: payload.name,
      focusArea: payload.focusArea ?? null,
      ledBy: payload.ledBy,
      description: payload.description ?? null,
      equipment: payload.equipment ?? null,
      safetyNotes: payload.safetyNotes ?? null,
      successCue: payload.successCue ?? null,
      progressionEasier: payload.progressionEasier ?? null,
      progressionHarder: payload.progressionHarder ?? null,
      durationMinutes: payload.durationMinutes ?? null,
      position: await nextActivityPosition(payload.schoolActivityCategoryId),
      isActive: true,
    })
    await syncActivityTags(activity, payload)

    session.flash('success', 'Activity added to the bank.')
    return response.redirect().toRoute('activity_bank.index')
  }

  async update({ auth, request, response, params, session }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const payload = await request.validateUsing(updateSchoolActivityValidator)
    const activity = await SchoolActivity.query()
      .where('id', params.id)
      .where('schoolId', schoolId)
      .firstOrFail()
    await assertActivityTagsBelongToBank(schoolId, payload)

    activity.merge({
      schoolActivityCategoryId: payload.schoolActivityCategoryId,
      name: payload.name,
      focusArea: payload.focusArea ?? null,
      ledBy: payload.ledBy,
      description: payload.description ?? null,
      equipment: payload.equipment ?? null,
      safetyNotes: payload.safetyNotes ?? null,
      successCue: payload.successCue ?? null,
      progressionEasier: payload.progressionEasier ?? null,
      progressionHarder: payload.progressionHarder ?? null,
      durationMinutes: payload.durationMinutes ?? null,
      sourceVersion: activity.sourceType === 'pack' ? null : activity.sourceVersion,
    })
    await activity.save()
    await syncActivityTags(activity, payload)

    session.flash('success', 'Activity updated.')
    return response.redirect().toRoute('activity_bank.index')
  }

  async destroy({ auth, response, params, session }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const activity = await SchoolActivity.query()
      .where('id', params.id)
      .where('schoolId', schoolId)
      .firstOrFail()

    activity.isActive = false
    if (activity.sourceType === 'pack') {
      activity.sourceVersion = null
    }
    await activity.save()

    session.flash('success', 'Activity removed from the bank.')
    return response.redirect().toRoute('activity_bank.index')
  }
}
