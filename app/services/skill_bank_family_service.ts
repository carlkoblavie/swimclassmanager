import SchoolSkillBankFamily from '#models/school_skill_bank_family'
import {
  DEFAULT_SKILL_BANK_FAMILIES,
  LEGACY_SKILL_BANK_FAMILY_KEYS,
} from '#values/skill_bank_family'

const defaultFamilyByKey = new Map(
  DEFAULT_SKILL_BANK_FAMILIES.map((family) => [family.familyKey, family])
)

function familyKeyFromName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'family'
  )
}

export default class SkillBankFamilyService {
  async forSchool(schoolId: number): Promise<SchoolSkillBankFamily[]> {
    await this.ensureDefaults(schoolId)

    return SchoolSkillBankFamily.query()
      .where('schoolId', schoolId)
      .where('isActive', true)
      .orderBy('position')
      .orderBy('displayName')
  }

  async ensureDefaults(schoolId: number): Promise<void> {
    await this.normalizeLegacyFamilies(schoolId)

    const existing = await SchoolSkillBankFamily.query().where('schoolId', schoolId)
    const existingKeys = new Set(existing.map((family) => family.familyKey))
    let nextPosition = existing.reduce((max, family) => Math.max(max, family.position), 0) + 1

    for (const [index, family] of DEFAULT_SKILL_BANK_FAMILIES.entries()) {
      if (existingKeys.has(family.familyKey)) {
        continue
      }

      await SchoolSkillBankFamily.create({
        schoolId,
        familyKey: family.familyKey,
        displayName: family.displayName,
        position: existing.length === 0 ? index + 1 : nextPosition,
        isActive: true,
      })
      nextPosition += 1
    }
  }

  async normalizeLegacyFamilies(schoolId: number): Promise<void> {
    const families = await SchoolSkillBankFamily.query().where('schoolId', schoolId)

    for (const family of families) {
      const normalizedFamilyKey =
        LEGACY_SKILL_BANK_FAMILY_KEYS.get(family.familyKey.trim().toLowerCase()) ??
        LEGACY_SKILL_BANK_FAMILY_KEYS.get(family.displayName.trim().toLowerCase())

      if (!normalizedFamilyKey) {
        continue
      }

      const defaultFamily = defaultFamilyByKey.get(normalizedFamilyKey)
      const displayNameMapsToDefault =
        LEGACY_SKILL_BANK_FAMILY_KEYS.get(family.displayName.trim().toLowerCase()) ===
        normalizedFamilyKey

      if (normalizedFamilyKey === family.familyKey) {
        if (
          defaultFamily &&
          displayNameMapsToDefault &&
          family.displayName !== defaultFamily.displayName
        ) {
          family.displayName = defaultFamily.displayName
          await family.save()
        }
        continue
      }

      const canonicalFamily = await SchoolSkillBankFamily.query()
        .where('schoolId', schoolId)
        .where('familyKey', normalizedFamilyKey)
        .whereNot('id', family.id)
        .first()

      if (canonicalFamily) {
        canonicalFamily.isActive = true
        if (defaultFamily && displayNameMapsToDefault) {
          canonicalFamily.displayName = defaultFamily.displayName
        }
        await canonicalFamily.save()

        family.isActive = false
        await family.save()
        continue
      }

      family.familyKey = normalizedFamilyKey
      if (defaultFamily && displayNameMapsToDefault) {
        family.displayName = defaultFamily.displayName
      }
      await family.save()
    }
  }

  async nextPosition(schoolId: number): Promise<number> {
    const total = await SchoolSkillBankFamily.query()
      .where('schoolId', schoolId)
      .count('* as total')

    return Number(total[0].$extras.total) + 1
  }

  async uniqueFamilyKey(schoolId: number, displayName: string): Promise<string> {
    const legacyKey = LEGACY_SKILL_BANK_FAMILY_KEYS.get(displayName.trim().toLowerCase())
    const baseKey = legacyKey ?? familyKeyFromName(displayName)
    let candidate = baseKey
    let suffix = 2

    while (
      await SchoolSkillBankFamily.query()
        .where('schoolId', schoolId)
        .where('familyKey', candidate)
        .first()
    ) {
      candidate = `${baseKey}_${suffix}`
      suffix += 1
    }

    return candidate
  }
}
