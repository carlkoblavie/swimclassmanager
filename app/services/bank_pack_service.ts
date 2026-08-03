import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import SchoolActivityBankService from '#services/school_activity_bank_service'
import SchoolAgeGroupService from '#services/school_age_group_service'
import SkillBankFamilyService from '#services/skill_bank_family_service'
import SkillBankService from '#services/skill_bank_service'
import {
  bankPackActivitySourceKey,
  bankPackSkillSourceKey,
  DEFAULT_BANK_PACKS,
  type BankPackDefinition,
} from '#values/bank_pack'

type BankPackRow = {
  id: number
  key: string
  name: string
  description: string | null
  version: string
  plan_tier: string
  is_active: boolean | number
}

type SchoolBankPackRow = {
  bank_pack_id: number
  enabled_version: string
  last_synced_version: string | null
  is_enabled: boolean | number
}

export type BankPackState = {
  id: number
  key: string
  name: string
  description: string | null
  version: string
  planTier: string
  enabled: boolean
  enabledVersion: string | null
  lastSyncedVersion: string | null
  updateAvailable: boolean
  skillCount: number
  activityCount: number
}

function timestamp() {
  return DateTime.now().toSQL({ includeOffset: false })
}

function normalizeBoolean(value: boolean | number) {
  return value === true || value === 1
}

function versionIsBehind(current: string | null | undefined, latest: string) {
  if (!current) {
    return true
  }

  const currentParts = current.split('.').map((part) => Number(part))
  const latestParts = latest.split('.').map((part) => Number(part))
  const length = Math.max(currentParts.length, latestParts.length)

  for (let index = 0; index < length; index += 1) {
    const currentPart = currentParts[index] ?? 0
    const latestPart = latestParts[index] ?? 0

    if (currentPart < latestPart) {
      return true
    }

    if (currentPart > latestPart) {
      return false
    }
  }

  return false
}

export default class BankPackService {
  async forSchool(schoolId: number): Promise<BankPackState[]> {
    await this.ensureCatalog()

    const [packs, schoolPacks] = await Promise.all([
      db.from('bank_packs').where('is_active', true).orderBy('name'),
      db.from('school_bank_packs').where('school_id', schoolId),
    ])
    const schoolPackByPackId = new Map<number, SchoolBankPackRow>(
      schoolPacks.map((row) => [Number(row.bank_pack_id), row as SchoolBankPackRow])
    )

    return packs.map((pack: BankPackRow) => {
      const definition = DEFAULT_BANK_PACKS.find((candidate) => candidate.key === pack.key)
      const schoolPack = schoolPackByPackId.get(Number(pack.id))
      const enabled = schoolPack ? normalizeBoolean(schoolPack.is_enabled) : false

      return {
        id: Number(pack.id),
        key: pack.key,
        name: pack.name,
        description: pack.description,
        version: pack.version,
        planTier: pack.plan_tier,
        enabled,
        enabledVersion: schoolPack?.enabled_version ?? null,
        lastSyncedVersion: schoolPack?.last_synced_version ?? null,
        updateAvailable: enabled && versionIsBehind(schoolPack?.last_synced_version, pack.version),
        skillCount: definition?.skills.length ?? 0,
        activityCount: definition?.activities.length ?? 0,
      }
    })
  }

  async enablePack(schoolId: number, packId: number): Promise<void> {
    await this.ensureCatalog()

    const pack = (await db
      .from('bank_packs')
      .where('id', packId)
      .where('is_active', true)
      .first()) as BankPackRow | null
    if (!pack) {
      throw new Error('Choose an available bank pack.')
    }

    const now = timestamp()
    const existing = await db
      .from('school_bank_packs')
      .where('school_id', schoolId)
      .where('bank_pack_id', pack.id)
      .first()

    if (existing) {
      await db.from('school_bank_packs').where('id', existing.id).update({
        enabled_version: pack.version,
        is_enabled: true,
        updated_at: now,
      })
    } else {
      await db.table('school_bank_packs').insert({
        school_id: schoolId,
        bank_pack_id: pack.id,
        enabled_version: pack.version,
        last_synced_version: null,
        is_enabled: true,
        created_at: now,
        updated_at: now,
      })
    }

    await this.syncPackForSchool(schoolId, pack)
  }

  async syncEnabledPacks(schoolId: number): Promise<void> {
    await this.ensureCatalog()

    const packs = (await db
      .from('bank_packs')
      .join('school_bank_packs', 'school_bank_packs.bank_pack_id', 'bank_packs.id')
      .where('school_bank_packs.school_id', schoolId)
      .where('school_bank_packs.is_enabled', true)
      .where('bank_packs.is_active', true)
      .select('bank_packs.*')) as BankPackRow[]

    for (const pack of packs) {
      await this.syncPackForSchool(schoolId, pack)
    }
  }

  async ensureCatalog(): Promise<void> {
    for (const definition of DEFAULT_BANK_PACKS) {
      const now = timestamp()
      const existing = await db.from('bank_packs').where('key', definition.key).first()

      if (existing) {
        await db.from('bank_packs').where('id', existing.id).update({
          name: definition.name,
          description: definition.description,
          version: definition.version,
          plan_tier: definition.planTier,
          is_active: true,
          updated_at: now,
        })
      } else {
        await db.table('bank_packs').insert({
          key: definition.key,
          name: definition.name,
          description: definition.description,
          version: definition.version,
          plan_tier: definition.planTier,
          is_active: true,
          created_at: now,
          updated_at: now,
        })
      }
    }
  }

  protected async syncPackForSchool(schoolId: number, pack: BankPackRow): Promise<void> {
    const definition = DEFAULT_BANK_PACKS.find((candidate) => candidate.key === pack.key)
    if (!definition) {
      return
    }

    await new SkillBankFamilyService().ensureDefaults(schoolId)
    await new SkillBankService().ensureDefaults()
    await new SchoolAgeGroupService().ensureDefaults(schoolId)
    await new SchoolActivityBankService().ensureStarterBank(schoolId)

    await this.syncPackSkills(schoolId, definition)
    await this.syncPackActivities(schoolId, definition)

    await db
      .from('school_bank_packs')
      .where('school_id', schoolId)
      .where('bank_pack_id', pack.id)
      .update({
        last_synced_version: pack.version,
        updated_at: timestamp(),
      })
  }

  protected async syncPackSkills(schoolId: number, definition: BankPackDefinition) {
    let fallbackPosition = await this.nextSkillPosition(schoolId)

    for (const [index, skill] of definition.skills.entries()) {
      const sourceKey = bankPackSkillSourceKey(definition.key, skill.key)
      const existing = await db
        .from('skill_bank_skills')
        .where('school_id', schoolId)
        .where('source_key', sourceKey)
        .first()
      if (existing && existing.source_version === null) {
        continue
      }
      const position = existing ? Number(existing.position) : fallbackPosition + index
      const values = {
        school_id: schoolId,
        source_type: 'pack',
        source_key: sourceKey,
        source_version: definition.version,
        family: skill.family,
        name: skill.name,
        description: skill.description,
        pass_criteria: skill.passCriteria,
        position,
        is_active: true,
        created_by_user_id: null,
        updated_at: timestamp(),
      }

      if (existing) {
        await db.from('skill_bank_skills').where('id', existing.id).update(values)
      } else {
        await db.table('skill_bank_skills').insert({
          ...values,
          created_at: timestamp(),
        })
      }
    }
  }

  protected async syncPackActivities(schoolId: number, definition: BankPackDefinition) {
    const packSkillSourceKeys = definition.skills.map((skill) =>
      bankPackSkillSourceKey(definition.key, skill.key)
    )
    const skillRows =
      packSkillSourceKeys.length > 0
        ? await db
            .from('skill_bank_skills')
            .where('school_id', schoolId)
            .where('source_type', 'pack')
            .whereIn('source_key', packSkillSourceKeys)
            .select('id', 'source_key')
        : []
    const skillIdBySourceKey = new Map(
      skillRows.map((row) => [String(row.source_key), Number(row.id)])
    )
    const ageRows = await db
      .from('school_age_groups')
      .where('school_id', schoolId)
      .where('is_active', true)
      .select('id', 'age_group_key')
    const ageGroupIdByKey = new Map(
      ageRows.map((row) => [String(row.age_group_key), Number(row.id)])
    )

    for (const activity of definition.activities) {
      const categoryId = await this.ensureActivityCategory(
        schoolId,
        activity.categoryName,
        activity.categoryPurpose
      )
      const sourceKey = bankPackActivitySourceKey(definition.key, activity.key)
      const existing = await db
        .from('school_activities')
        .where('school_id', schoolId)
        .where('source_key', sourceKey)
        .first()
      if (existing && existing.source_version === null) {
        continue
      }
      const position = existing
        ? Number(existing.position)
        : await this.nextActivityPosition(categoryId)
      const values = {
        school_id: schoolId,
        school_activity_category_id: categoryId,
        source_type: 'pack',
        source_key: sourceKey,
        source_version: definition.version,
        name: activity.name,
        focus_area: activity.focusArea,
        led_by: activity.ledBy,
        description: activity.description,
        equipment: activity.equipment ?? null,
        safety_notes: activity.safetyNotes ?? null,
        success_cue: activity.successCue,
        progression_easier: activity.progressionEasier ?? null,
        progression_harder: activity.progressionHarder ?? null,
        duration_minutes: activity.durationMinutes,
        position,
        is_active: true,
        updated_at: timestamp(),
      }
      const activityId = existing
        ? Number(existing.id)
        : await this.insertActivityAndReturnId({
            ...values,
            created_at: timestamp(),
          })

      if (existing) {
        await db.from('school_activities').where('id', existing.id).update(values)
      }

      await this.syncActivityAgeTags(
        activityId,
        activity.ageGroupKeys.flatMap((key) => ageGroupIdByKey.get(key) ?? [])
      )
      await this.syncActivitySkillTags(
        activityId,
        activity.skillKeys.flatMap(
          (key) => skillIdBySourceKey.get(bankPackSkillSourceKey(definition.key, key)) ?? []
        )
      )
    }
  }

  protected async ensureActivityCategory(
    schoolId: number,
    name: string,
    purpose: number
  ): Promise<number> {
    const existing = await db
      .from('school_activity_categories')
      .where('school_id', schoolId)
      .where('name', name)
      .first()
    if (existing) {
      return Number(existing.id)
    }

    const total = await db
      .from('school_activity_categories')
      .where('school_id', schoolId)
      .count('* as total')
    const [id] = await db.table('school_activity_categories').insert({
      school_id: schoolId,
      name,
      purpose,
      position: Number(total[0].total) + 1,
      is_active: true,
      created_at: timestamp(),
      updated_at: timestamp(),
    })

    return Number(id)
  }

  protected async nextSkillPosition(schoolId: number): Promise<number> {
    const total = await db
      .from('skill_bank_skills')
      .where('school_id', schoolId)
      .count('* as total')

    return Number(total[0].total) + 1
  }

  protected async nextActivityPosition(categoryId: number): Promise<number> {
    const total = await db
      .from('school_activities')
      .where('school_activity_category_id', categoryId)
      .count('* as total')

    return Number(total[0].total) + 1
  }

  protected async insertActivityAndReturnId(values: Record<string, unknown>): Promise<number> {
    const [id] = await db.table('school_activities').insert(values)
    return Number(id)
  }

  protected async syncActivityAgeTags(activityId: number, ageGroupIds: number[]) {
    await db.from('school_activity_age_groups').where('school_activity_id', activityId).delete()
    if (ageGroupIds.length === 0) {
      return
    }

    await db.table('school_activity_age_groups').multiInsert(
      ageGroupIds.map((schoolAgeGroupId) => ({
        school_activity_id: activityId,
        school_age_group_id: schoolAgeGroupId,
      }))
    )
  }

  protected async syncActivitySkillTags(activityId: number, skillBankSkillIds: number[]) {
    await db
      .from('school_activity_skill_bank_skills')
      .where('school_activity_id', activityId)
      .delete()
    if (skillBankSkillIds.length === 0) {
      return
    }

    await db.table('school_activity_skill_bank_skills').multiInsert(
      skillBankSkillIds.map((skillBankSkillId) => ({
        school_activity_id: activityId,
        skill_bank_skill_id: skillBankSkillId,
      }))
    )
  }
}
