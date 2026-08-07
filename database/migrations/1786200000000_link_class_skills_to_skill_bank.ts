import { BaseSchema } from '@adonisjs/lucid/schema'
import { SkillBankFamilyKey } from '#values/skill_bank_family'

type Db = Parameters<Parameters<BaseSchema['defer']>[0]>[0]

export default class extends BaseSchema {
  protected tableName = 'class_skills'

  async up() {
    const hasSkillBankSkillId = await this.schema.hasColumn(this.tableName, 'skill_bank_skill_id')
    if (!hasSkillBankSkillId) {
      this.schema.alterTable(this.tableName, (table) => {
        table
          .integer('skill_bank_skill_id')
          .unsigned()
          .nullable()
          .references('skill_bank_skills.id')
          .onDelete('RESTRICT')
        table.setNullable('level_stage_skill_id')
      })
    }

    this.defer(async (db) => {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

      const existingClassSkills = await db
        .from(this.tableName)
        .select('id', 'swimming_class_id', 'level_stage_skill_id', 'skill_bank_skill_id')

      const existingKeys = new Set(
        existingClassSkills.flatMap((row) =>
          row.skill_bank_skill_id ? [`${row.swimming_class_id}-${row.skill_bank_skill_id}`] : []
        )
      )

      for (const row of existingClassSkills) {
        if (row.skill_bank_skill_id || !row.level_stage_skill_id) {
          continue
        }

        const bankSkillId = await this.resolveBankSkillId(
          db,
          Number(row.swimming_class_id),
          Number(row.level_stage_skill_id),
          now
        )
        if (!bankSkillId) {
          continue
        }

        await db
          .from(this.tableName)
          .where('id', row.id)
          .update({ skill_bank_skill_id: bankSkillId })
        existingKeys.add(`${row.swimming_class_id}-${bankSkillId}`)
      }

      const classes = await db
        .from('swimming_classes')
        .whereNotNull('level_stage_id')
        .select('id', 'level_stage_id')

      for (const swimmingClass of classes) {
        const stageSkills = await db
          .from('level_stage_skills')
          .where('level_stage_id', swimmingClass.level_stage_id)
          .select('id')

        for (const stageSkill of stageSkills) {
          const bankSkillId = await this.resolveBankSkillId(
            db,
            Number(swimmingClass.id),
            Number(stageSkill.id),
            now
          )
          if (!bankSkillId) {
            continue
          }

          const key = `${swimmingClass.id}-${bankSkillId}`
          if (existingKeys.has(key)) {
            continue
          }

          await db.table(this.tableName).insert({
            swimming_class_id: swimmingClass.id,
            level_stage_skill_id: stageSkill.id,
            skill_bank_skill_id: bankSkillId,
            created_at: now,
            updated_at: null,
          })
          existingKeys.add(key)
        }
      }
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(
        ['swimming_class_id', 'level_stage_skill_id'],
        'class_skills_class_skill_unique'
      )
      table.unique(['swimming_class_id', 'skill_bank_skill_id'], {
        indexName: 'class_skills_class_bank_skill_unique',
      })
      table.dropNullable('skill_bank_skill_id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(
        ['swimming_class_id', 'skill_bank_skill_id'],
        'class_skills_class_bank_skill_unique'
      )
      table.unique(['swimming_class_id', 'level_stage_skill_id'], {
        indexName: 'class_skills_class_skill_unique',
      })
      table.dropColumn('skill_bank_skill_id')
      table.dropNullable('level_stage_skill_id')
    })
  }

  protected async resolveBankSkillId(
    db: Db,
    swimmingClassId: number,
    levelStageSkillId: number,
    now: string
  ): Promise<number | null> {
    const swimmingClass = await db
      .from('swimming_classes')
      .where('id', swimmingClassId)
      .select('school_id')
      .first()
    const stageSkill = await db
      .from('level_stage_skills')
      .where('id', levelStageSkillId)
      .select('id', 'name', 'description', 'pass_criteria')
      .first()

    if (!swimmingClass || !stageSkill) {
      return null
    }

    const schoolId = Number(swimmingClass.school_id)
    const name = String(stageSkill.name).trim()
    const sourceKey = `level_stage_skill:${stageSkill.id}`
    const normalizedName = name.toLowerCase()

    const bySource = await db
      .from('skill_bank_skills')
      .where('school_id', schoolId)
      .where('source_key', sourceKey)
      .select('id')
      .first()
    if (bySource) {
      return Number(bySource.id)
    }

    const bySchoolName = await db
      .from('skill_bank_skills')
      .where('school_id', schoolId)
      .whereRaw('lower(name) = ?', [normalizedName])
      .select('id')
      .first()
    if (bySchoolName) {
      return Number(bySchoolName.id)
    }

    const byGlobalName = await db
      .from('skill_bank_skills')
      .whereNull('school_id')
      .where('is_active', true)
      .whereRaw('lower(name) = ?', [normalizedName])
      .select('id')
      .first()
    if (byGlobalName) {
      return Number(byGlobalName.id)
    }

    const positionRows = await db
      .from('skill_bank_skills')
      .where('school_id', schoolId)
      .where('family', SkillBankFamilyKey.WATER_COMFORT_ORIENTATION)
      .count('* as total')
    const position = Number(positionRows[0]?.total ?? 0) + 1

    const ids = await db.table('skill_bank_skills').insert({
      school_id: schoolId,
      source_type: 'legacy',
      source_key: sourceKey,
      source_version: null,
      family: SkillBankFamilyKey.WATER_COMFORT_ORIENTATION,
      name,
      description: stageSkill.description ?? null,
      pass_criteria: stageSkill.pass_criteria ?? null,
      position,
      is_active: true,
      created_by_user_id: null,
      created_at: now,
      updated_at: null,
    })

    return Number(Array.isArray(ids) ? ids[0] : ids)
  }
}
