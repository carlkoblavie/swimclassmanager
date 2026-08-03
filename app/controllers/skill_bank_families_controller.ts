import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SchoolSkillBankFamily from '#models/school_skill_bank_family'
import SkillBankFamilyService from '#services/skill_bank_family_service'
import { storeSkillBankFamilyValidator, updateSkillBankFamilyValidator } from '#validators/bank'

export default class SkillBankFamiliesController {
  @inject()
  async store({ auth, request, response, session }: HttpContext, families: SkillBankFamilyService) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const payload = await request.validateUsing(storeSkillBankFamilyValidator)
    await families.ensureDefaults(schoolId)

    const duplicate = await SchoolSkillBankFamily.query()
      .where('schoolId', schoolId)
      .whereRaw('lower(display_name) = ?', [payload.displayName.toLowerCase()])
      .where('isActive', true)
      .first()
    if (duplicate) {
      session.flash('error', 'A skill family with this name already exists.')
      return response.redirect().back()
    }

    await SchoolSkillBankFamily.create({
      schoolId,
      familyKey: await families.uniqueFamilyKey(schoolId, payload.displayName),
      displayName: payload.displayName,
      position: await families.nextPosition(schoolId),
      isActive: true,
    })

    session.flash('success', 'Skill family added.')
    return response.redirect().toRoute('skill_bank.index')
  }

  async update({ auth, request, response, params, session }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const payload = await request.validateUsing(updateSkillBankFamilyValidator)
    const family = await SchoolSkillBankFamily.query()
      .where('id', params.id)
      .where('schoolId', schoolId)
      .firstOrFail()

    const duplicate = await SchoolSkillBankFamily.query()
      .where('schoolId', schoolId)
      .whereRaw('lower(display_name) = ?', [payload.displayName.toLowerCase()])
      .whereNot('id', family.id)
      .where('isActive', true)
      .first()
    if (duplicate) {
      session.flash('error', 'A skill family with this name already exists.')
      return response.redirect().back()
    }

    family.displayName = payload.displayName
    await family.save()

    session.flash('success', 'Skill family renamed.')
    return response.redirect().toRoute('skill_bank.index')
  }

  async destroy({ auth, response, params, session }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const family = await SchoolSkillBankFamily.query()
      .where('id', params.id)
      .where('schoolId', schoolId)
      .where('isActive', true)
      .firstOrFail()

    family.isActive = false
    await family.save()

    session.flash('success', 'Skill family deleted.')
    return response.redirect().toRoute('skill_bank.index')
  }
}
