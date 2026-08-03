import type { HttpContext } from '@adonisjs/core/http'
import SchoolAgeGroup from '#models/school_age_group'
import { storeSchoolAgeGroupValidator, updateSchoolAgeGroupValidator } from '#validators/bank'

type AgeGroupPayload = Awaited<ReturnType<typeof storeSchoolAgeGroupValidator.validate>>

function normalizeRange(payload: AgeGroupPayload) {
  const minAgeYear = payload.minAgeYear ?? null
  const maxAgeYear = payload.maxAgeYear ?? null

  if (minAgeYear !== null && maxAgeYear !== null && minAgeYear > maxAgeYear) {
    throw new Error('Minimum age cannot be higher than maximum age.')
  }

  return { minAgeYear, maxAgeYear }
}

function slugifyAgeGroupKey(displayName: string) {
  const key = displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return key || 'age_group'
}

async function uniqueAgeGroupKey(schoolId: number, displayName: string) {
  const baseKey = slugifyAgeGroupKey(displayName)
  let candidate = baseKey
  let suffix = 2

  while (
    await SchoolAgeGroup.query().where('schoolId', schoolId).where('ageGroupKey', candidate).first()
  ) {
    candidate = `${baseKey}_${suffix}`
    suffix += 1
  }

  return candidate
}

async function nextPosition(schoolId: number) {
  const total = await SchoolAgeGroup.query().where('schoolId', schoolId).count('* as total')
  return Number(total[0].$extras.total) + 1
}

export default class SchoolAgeGroupsController {
  async store({ auth, request, response, session }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const payload = await request.validateUsing(storeSchoolAgeGroupValidator)

    try {
      const { minAgeYear, maxAgeYear } = normalizeRange(payload)
      await SchoolAgeGroup.create({
        schoolId,
        ageGroupKey: await uniqueAgeGroupKey(schoolId, payload.displayName),
        displayName: payload.displayName,
        minAgeYear,
        maxAgeYear,
        position: await nextPosition(schoolId),
        isActive: payload.isActive ?? true,
      })
    } catch (error) {
      session.flash('error', error instanceof Error ? error.message : 'Could not add age group.')
      return response.redirect().back()
    }

    session.flash('success', 'Age group added.')
    return response.redirect().toRoute('swim_years.index')
  }

  async update({ auth, request, response, params, session }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const payload = await request.validateUsing(updateSchoolAgeGroupValidator)
    const ageGroup = await SchoolAgeGroup.query()
      .where('id', params.id)
      .where('schoolId', schoolId)
      .firstOrFail()

    try {
      const { minAgeYear, maxAgeYear } = normalizeRange(payload)
      ageGroup.merge({
        displayName: payload.displayName,
        minAgeYear,
        maxAgeYear,
        isActive: payload.isActive ?? false,
      })
      await ageGroup.save()
    } catch (error) {
      session.flash('error', error instanceof Error ? error.message : 'Could not update age group.')
      return response.redirect().back()
    }

    session.flash('success', 'Age group updated.')
    return response.redirect().toRoute('swim_years.index')
  }

  async destroy({ auth, response, params, session }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const ageGroup = await SchoolAgeGroup.query()
      .where('id', params.id)
      .where('schoolId', schoolId)
      .firstOrFail()

    ageGroup.isActive = false
    await ageGroup.save()

    session.flash('success', 'Age group disabled.')
    return response.redirect().toRoute('swim_years.index')
  }
}
