import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import SkillBankSkill from '#models/skill_bank_skill'
import BankPackService from '#services/bank_pack_service'
import SkillBankFamilyService from '#services/skill_bank_family_service'
import SkillBankService, { globalSkillOverrideSourceKey } from '#services/skill_bank_service'
import { storeSkillBankSkillValidator, updateSkillBankSkillValidator } from '#validators/bank'

async function schoolActivityIds(schoolId: number): Promise<number[]> {
  const rows = await db.from('school_activities').where('school_id', schoolId).select('id')
  return rows.map((row) => Number(row.id))
}

async function moveSchoolActivitySkillTags(
  schoolId: number,
  fromSkillId: number,
  toSkillId: number
) {
  const activityIds = await schoolActivityIds(schoolId)
  if (activityIds.length === 0) {
    return
  }

  const duplicateRows = await db
    .from('school_activity_skill_bank_skills')
    .whereIn('school_activity_id', activityIds)
    .where('skill_bank_skill_id', toSkillId)
    .select('school_activity_id')
  const duplicateActivityIds = new Set(duplicateRows.map((row) => Number(row.school_activity_id)))
  if (duplicateActivityIds.size > 0) {
    await db
      .from('school_activity_skill_bank_skills')
      .whereIn('school_activity_id', [...duplicateActivityIds])
      .where('skill_bank_skill_id', fromSkillId)
      .delete()
  }

  const activityIdsToMove = activityIds.filter(
    (activityId) => !duplicateActivityIds.has(activityId)
  )
  if (activityIdsToMove.length === 0) {
    return
  }

  await db
    .from('school_activity_skill_bank_skills')
    .whereIn('school_activity_id', activityIdsToMove)
    .where('skill_bank_skill_id', fromSkillId)
    .update({ skill_bank_skill_id: toSkillId })
}

async function removeSchoolActivitySkillTags(schoolId: number, skillId: number) {
  const activityIds = await schoolActivityIds(schoolId)
  if (activityIds.length === 0) {
    return
  }

  await db
    .from('school_activity_skill_bank_skills')
    .whereIn('school_activity_id', activityIds)
    .where('skill_bank_skill_id', skillId)
    .delete()
}

export default class SkillBankSkillsController {
  @inject()
  async index(
    { auth, inertia }: HttpContext,
    bank: SkillBankService,
    families: SkillBankFamilyService,
    packs: BankPackService
  ) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    await packs.syncEnabledPacks(schoolId)
    const [allSkills, schoolFamilies] = await Promise.all([
      bank.forSchool(schoolId),
      families.forSchool(schoolId),
    ])
    const activeFamilyKeys = new Set(schoolFamilies.map((family) => family.familyKey))
    const skills = allSkills.filter((skill) => activeFamilyKeys.has(skill.family))
    const skillIds = skills.map((skill) => skill.id)
    const linkedActivityRows =
      skillIds.length > 0
        ? await db
            .from('school_activity_skill_bank_skills')
            .join(
              'school_activities',
              'school_activities.id',
              'school_activity_skill_bank_skills.school_activity_id'
            )
            .whereIn('skill_bank_skill_id', skillIds)
            .where('school_activities.school_id', schoolId)
            .where('school_activities.is_active', true)
            .select('skill_bank_skill_id')
        : []
    const linkedActivityCountsByFamily = new Map<string, number>()
    const familyBySkillId = new Map(skills.map((skill) => [skill.id, skill.family]))
    for (const row of linkedActivityRows) {
      const familyKey = familyBySkillId.get(Number(row.skill_bank_skill_id))
      if (!familyKey) {
        continue
      }
      linkedActivityCountsByFamily.set(
        familyKey,
        (linkedActivityCountsByFamily.get(familyKey) ?? 0) + 1
      )
    }

    return inertia.render('banks/skills', {
      families: schoolFamilies.map((family) => ({
        id: family.id,
        familyKey: family.familyKey,
        displayName: family.displayName,
        position: family.position,
        linkedActivityCount: linkedActivityCountsByFamily.get(family.familyKey) ?? 0,
      })),
      skills: skills.map((skill) => ({
        id: skill.id,
        schoolId: skill.schoolId,
        sourceType: skill.sourceType,
        sourceKey: skill.sourceKey,
        familyKey: skill.family,
        name: skill.name,
        description: skill.description,
        passCriteria: skill.passCriteria,
        position: skill.position,
        editable:
          skill.schoolId === null ||
          (skill.schoolId === schoolId &&
            ['school', 'pack', 'global', 'legacy'].includes(skill.sourceType)),
      })),
    })
  }

  @inject()
  async store(
    { auth, request, response, session }: HttpContext,
    bank: SkillBankService,
    families: SkillBankFamilyService
  ) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(storeSkillBankSkillValidator)
    const schoolId = user.activeSchoolId!
    const family = (await families.forSchool(schoolId)).find(
      (candidate) => candidate.familyKey === payload.familyKey
    )
    if (!family) {
      session.flash('error', 'Choose a skill family from this school.')
      return response.redirect().back()
    }

    await SkillBankSkill.create({
      schoolId,
      sourceType: 'school',
      sourceKey: null,
      family: payload.familyKey,
      name: payload.name,
      description: payload.description ?? null,
      passCriteria: payload.passCriteria ?? null,
      position: await bank.nextSchoolPosition(schoolId, payload.familyKey),
      isActive: true,
      createdByUserId: user.id,
    })

    session.flash('success', 'Skill added to the bank.')
    return response.redirect().toRoute('skill_bank.index')
  }

  @inject()
  async update(
    { auth, request, response, params, session }: HttpContext,
    families: SkillBankFamilyService,
    bank: SkillBankService
  ) {
    const user = auth.getUserOrFail()
    const schoolId = user.activeSchoolId!
    const payload = await request.validateUsing(updateSkillBankSkillValidator)
    const skill = await SkillBankSkill.query()
      .where('id', params.id)
      .where((query) => query.where('schoolId', schoolId).orWhereNull('schoolId'))
      .firstOrFail()
    const family = (await families.forSchool(schoolId)).find(
      (candidate) => candidate.familyKey === payload.familyKey
    )
    if (!family) {
      session.flash('error', 'Choose a skill family from this school.')
      return response.redirect().back()
    }

    if (skill.schoolId === null) {
      const overrideSourceKey = globalSkillOverrideSourceKey(skill.id)
      const existingOverride = await SkillBankSkill.query()
        .where('schoolId', schoolId)
        .where('sourceType', 'global')
        .where('sourceKey', overrideSourceKey)
        .first()

      if (existingOverride) {
        existingOverride.merge({
          family: payload.familyKey,
          name: payload.name,
          description: payload.description ?? null,
          passCriteria: payload.passCriteria ?? null,
          sourceVersion: null,
          isActive: true,
        })
        await existingOverride.save()
        await moveSchoolActivitySkillTags(schoolId, skill.id, existingOverride.id)
      } else {
        const override = await SkillBankSkill.create({
          schoolId,
          sourceType: 'global',
          sourceKey: overrideSourceKey,
          sourceVersion: null,
          family: payload.familyKey,
          name: payload.name,
          description: payload.description ?? null,
          passCriteria: payload.passCriteria ?? null,
          position: await bank.nextSchoolPosition(schoolId, payload.familyKey),
          isActive: true,
          createdByUserId: user.id,
        })
        await moveSchoolActivitySkillTags(schoolId, skill.id, override.id)
      }

      session.flash('success', 'Skill updated.')
      return response.redirect().toRoute('skill_bank.index')
    }

    skill.merge({
      family: payload.familyKey,
      name: payload.name,
      description: payload.description ?? null,
      passCriteria: payload.passCriteria ?? null,
      sourceVersion: ['pack', 'global'].includes(skill.sourceType) ? null : skill.sourceVersion,
    })
    await skill.save()

    session.flash('success', 'Skill updated.')
    return response.redirect().toRoute('skill_bank.index')
  }

  async destroy({ auth, response, params, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const schoolId = user.activeSchoolId!
    const skill = await SkillBankSkill.query()
      .where('id', params.id)
      .where((query) => query.where('schoolId', schoolId).orWhereNull('schoolId'))
      .firstOrFail()

    if (skill.schoolId === null) {
      const overrideSourceKey = globalSkillOverrideSourceKey(skill.id)
      const existingOverride = await SkillBankSkill.query()
        .where('schoolId', schoolId)
        .where('sourceType', 'global')
        .where('sourceKey', overrideSourceKey)
        .first()

      if (existingOverride) {
        existingOverride.isActive = false
        existingOverride.sourceVersion = null
        await existingOverride.save()
        await removeSchoolActivitySkillTags(schoolId, existingOverride.id)
      } else {
        await SkillBankSkill.create({
          schoolId,
          sourceType: 'global',
          sourceKey: overrideSourceKey,
          sourceVersion: null,
          family: skill.family,
          name: skill.name,
          description: skill.description,
          passCriteria: skill.passCriteria,
          position: skill.position,
          isActive: false,
          createdByUserId: user.id,
        })
      }
      await removeSchoolActivitySkillTags(schoolId, skill.id)

      session.flash('success', 'Skill removed from the school bank.')
      return response.redirect().toRoute('skill_bank.index')
    }

    skill.isActive = false
    if (['pack', 'global'].includes(skill.sourceType)) {
      skill.sourceVersion = null
    }
    await skill.save()

    session.flash('success', 'Skill removed from the school bank.')
    return response.redirect().toRoute('skill_bank.index')
  }
}
