import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import LevelStageSkill from '#models/level_stage_skill'
import SkillBankSkill from '#models/skill_bank_skill'
import { LEGACY_SKILL_BANK_FAMILY_KEYS, SkillBankFamilyKey } from '#values/skill_bank_family'

type LegacySkillImportSummary = {
  imported: number
  skipped: number
}

export function globalSkillOverrideSourceKey(skillId: number) {
  return `global:${skillId}`
}

function legacySkillSourceKey(skillId: number) {
  return `level_stage_skill:${skillId}`
}

function normalizedSkillName(name: string) {
  return name.trim().toLowerCase()
}

function inferLegacySkillFamily(skill: LevelStageSkill): SkillBankFamilyKey {
  const text = [skill.name, skill.description, skill.passCriteria].filter(Boolean).join(' ')
  const normalized = text.toLowerCase()

  if (
    /\b(freestyle|backstroke|breaststroke|butterfly|stroke|arm|catch|pull|recovery)\b/.test(
      normalized
    )
  ) {
    return SkillBankFamilyKey.STROKE_TECHNIQUE
  }

  if (/\b(kick|glide|streamline|propulsion|push|dolphin)\b/.test(normalized)) {
    return SkillBankFamilyKey.PROPULSION
  }

  if (
    /\b(float|tread\w*|scull\w*|safety|survival|rescue|roll|jump|turn|return)\b/.test(normalized)
  ) {
    return SkillBankFamilyKey.WATER_SAFETY_SURVIVAL
  }

  return SkillBankFamilyKey.WATER_COMFORT_ORIENTATION
}

const DEFAULT_SKILLS = [
  {
    family: SkillBankFamilyKey.WATER_COMFORT_ORIENTATION,
    name: 'Comfort with submersion',
    description: 'Learner can place face in water calmly and recover to standing.',
    passCriteria: 'Calm face-in-water recovery',
  },
  {
    family: SkillBankFamilyKey.WATER_COMFORT_ORIENTATION,
    name: 'Rhythmic bubbles',
    description: 'Learner exhales steadily into water and inhales without panic.',
    passCriteria: 'Steady bubble pattern',
  },
  {
    family: SkillBankFamilyKey.WATER_SAFETY_SURVIVAL,
    name: 'Front float',
    description: 'Learner holds a relaxed front float and recovers safely.',
    passCriteria: 'Independent float and recovery',
  },
  {
    family: SkillBankFamilyKey.WATER_SAFETY_SURVIVAL,
    name: 'Back float',
    description: 'Learner maintains a calm back balance with face clear.',
    passCriteria: 'Calm back balance',
  },
  {
    family: SkillBankFamilyKey.PROPULSION,
    name: 'Flutter kick',
    description: 'Learner kicks from the hips while holding a long body line.',
    passCriteria: 'Consistent kick rhythm',
  },
  {
    family: SkillBankFamilyKey.WATER_SAFETY_SURVIVAL,
    name: 'Jump, turn, return',
    description: 'Learner enters, turns toward safety, and returns to the wall.',
    passCriteria: 'Returns to the wall safely',
  },
  {
    family: SkillBankFamilyKey.PROPULSION,
    name: 'Streamline push-off',
    description: 'Learner pushes from the wall in a long narrow body shape.',
    passCriteria: 'Straight glide before kicking',
  },
  {
    family: SkillBankFamilyKey.STROKE_TECHNIQUE,
    name: 'Freestyle arm mechanics',
    description: 'Learner practises a relaxed freestyle arm pull and recovery pattern.',
    passCriteria: 'Coordinated freestyle arm action',
  },
]

export default class SkillBankService {
  async forSchool(schoolId: number): Promise<SkillBankSkill[]> {
    await this.ensureDefaults()
    await this.syncLegacyStageSkills(schoolId)

    const skills = await SkillBankSkill.query()
      .where((query) => {
        query
          .where((globalQuery) => globalQuery.whereNull('schoolId').where('isActive', true))
          .orWhere('schoolId', schoolId)
      })
      .orderBy('family')
      .orderBy('position')
      .orderBy('name')

    const overriddenGlobalSkillIds = new Set(
      skills.flatMap((skill) => {
        if (skill.schoolId !== schoolId || skill.sourceType !== 'global' || !skill.sourceKey) {
          return []
        }

        const [, skillId] = skill.sourceKey.split(':')
        return skillId ? [Number(skillId)] : []
      })
    )

    return skills.filter((skill) => {
      if (skill.schoolId === null) {
        return !overriddenGlobalSkillIds.has(skill.id)
      }

      return skill.isActive
    })
  }

  async ensureDefaults(): Promise<void> {
    await this.normalizeLegacyFamilies()

    for (const [index, skill] of DEFAULT_SKILLS.entries()) {
      const existing = await SkillBankSkill.query()
        .whereNull('schoolId')
        .where('sourceType', 'global')
        .where('sourceKey', 'core')
        .where('name', skill.name)
        .first()

      if (existing) {
        continue
      }

      await SkillBankSkill.create({
        schoolId: null,
        sourceType: 'global',
        sourceKey: 'core',
        ...skill,
        position: index + 1,
        isActive: true,
        createdByUserId: null,
      })
    }
  }

  async normalizeLegacyFamilies(): Promise<void> {
    for (const [legacyFamily, familyKey] of LEGACY_SKILL_BANK_FAMILY_KEYS.entries()) {
      await SkillBankSkill.query().whereRaw('lower(family) = ?', [legacyFamily]).update({
        family: familyKey,
      })
    }
  }

  async syncLegacyStageSkills(
    schoolId: number,
    trx?: TransactionClientContract
  ): Promise<LegacySkillImportSummary> {
    const queryOptions = trx ? { client: trx } : undefined
    const legacySkills = await LevelStageSkill.query(queryOptions).orderBy('id')
    return this.syncLegacyStageSkillModels(schoolId, legacySkills, trx)
  }

  async syncLegacyStageSkillModels(
    schoolId: number,
    legacySkills: LevelStageSkill[],
    trx?: TransactionClientContract
  ): Promise<LegacySkillImportSummary> {
    const queryOptions = trx ? { client: trx } : undefined
    const existing = await SkillBankSkill.query(queryOptions).where((query) => {
      query.whereNull('schoolId').orWhere('schoolId', schoolId)
    })
    const existingSourceKeys = new Set(
      existing.flatMap((skill) =>
        skill.schoolId === schoolId && skill.sourceKey ? [skill.sourceKey] : []
      )
    )
    const existingNames = new Set(existing.map((skill) => normalizedSkillName(skill.name)))
    const summary: LegacySkillImportSummary = { imported: 0, skipped: 0 }

    for (const skill of legacySkills) {
      const sourceKey = legacySkillSourceKey(skill.id)
      const name = skill.name.trim()

      if (existingSourceKeys.has(sourceKey) || existingNames.has(normalizedSkillName(name))) {
        summary.skipped += 1
        continue
      }

      const family = inferLegacySkillFamily(skill)
      await SkillBankSkill.create(
        {
          schoolId,
          sourceType: 'legacy',
          sourceKey,
          sourceVersion: null,
          family,
          name,
          description: skill.description ?? null,
          passCriteria: skill.passCriteria ?? null,
          position: await this.nextSchoolPosition(schoolId, family, trx),
          isActive: true,
          createdByUserId: null,
        },
        queryOptions
      )

      existingSourceKeys.add(sourceKey)
      existingNames.add(normalizedSkillName(name))
      summary.imported += 1
    }

    return summary
  }

  async syncStageSkillModel(
    schoolId: number,
    skill: LevelStageSkill,
    familyOverride?: string,
    trx?: TransactionClientContract
  ): Promise<'imported' | 'updated' | 'skipped'> {
    const queryOptions = trx ? { client: trx } : undefined
    const sourceKey = legacySkillSourceKey(skill.id)
    const family = familyOverride ?? inferLegacySkillFamily(skill)
    const name = skill.name.trim()
    const existingBySource = await SkillBankSkill.query(queryOptions)
      .where('schoolId', schoolId)
      .where('sourceKey', sourceKey)
      .first()

    if (existingBySource) {
      existingBySource.merge({
        family,
        name,
        description: skill.description ?? null,
        passCriteria: skill.passCriteria ?? null,
        sourceVersion: null,
        isActive: true,
      })
      await existingBySource.save()
      return 'updated'
    }

    const existingName = await SkillBankSkill.query(queryOptions)
      .where((query) => query.whereNull('schoolId').orWhere('schoolId', schoolId))
      .whereRaw('lower(name) = ?', [normalizedSkillName(name)])
      .first()
    if (existingName) {
      return 'skipped'
    }

    await SkillBankSkill.create(
      {
        schoolId,
        sourceType: 'legacy',
        sourceKey,
        sourceVersion: null,
        family,
        name,
        description: skill.description ?? null,
        passCriteria: skill.passCriteria ?? null,
        position: await this.nextSchoolPosition(schoolId, family, trx),
        isActive: true,
        createdByUserId: null,
      },
      queryOptions
    )

    return 'imported'
  }

  async nextSchoolPosition(
    schoolId: number,
    familyKey: string,
    trx?: TransactionClientContract
  ): Promise<number> {
    const total = await SkillBankSkill.query(trx ? { client: trx } : undefined)
      .where('schoolId', schoolId)
      .where('family', familyKey)
      .count('* as total')

    return Number(total[0].$extras.total) + 1
  }
}
