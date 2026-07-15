import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Program from '#models/program'
import Level from '#models/level'
import LevelStage from '#models/level_stage'
import LevelStageActivity from '#models/level_stage_activity'
import LevelStageSkill from '#models/level_stage_skill'
import ClassActivity from '#models/class_activity'
import ClassSkill from '#models/class_skill'
import SwimmingClass from '#models/swimming_class'
import ProgramAuthoringException from '#exceptions/program_authoring_exception'
import { levelCode, nextTierNumber, programCode, stageCode } from '#values/account_code'
import type { Infer } from '@vinejs/vine/types'
import type { storeProgramValidator, updateProgramValidator } from '#validators/program'

type StoreData = Infer<typeof storeProgramValidator>
type UpdateData = Infer<typeof updateProgramValidator>

type StageInput = NonNullable<StoreData['levels'][number]['stages']>[number]
type SkillInput = NonNullable<StageInput['skills']>[number]
type ActivityInput = NonNullable<SkillInput['activities']>[number]

function toMinorUnits(cedis: number): number {
  return Math.round(cedis * 100)
}

// Codes are strictly system-generated with platform-continuous numbers per
// tier; this state carries every existing code plus ones reserved in-batch.
type CodeState = { levelCodes: string[]; stageCodes: string[] }

async function loadCodeState(trx: TransactionClientContract): Promise<CodeState> {
  const [levels, stages] = await Promise.all([
    trx.from('levels').select('code'),
    trx.from('level_stages').select('code'),
  ])
  return {
    levelCodes: levels.map((row: { code: unknown }) => String(row.code)),
    stageCodes: stages.map((row: { code: unknown }) => String(row.code)),
  }
}

function reserveLevelCode(parentProgramCode: string, codes: CodeState): string {
  const code = levelCode(parentProgramCode, nextTierNumber(codes.levelCodes, 'level'))
  codes.levelCodes.push(code)
  return code
}

function reserveStageCode(parentLevelCode: string, codes: CodeState): string {
  const code = stageCode(parentLevelCode, nextTierNumber(codes.stageCodes, 'stage'))
  codes.stageCodes.push(code)
  return code
}

/**
 * Curriculum rows are reconciled by id (update kept, create new, delete
 * missing) rather than replaced, because classes reference them. Deleting
 * curriculum a class uses is refused.
 */
async function reconcileActivities(
  skill: LevelStageSkill,
  inputs: ActivityInput[],
  trx: TransactionClientContract
): Promise<void> {
  const existing = await LevelStageActivity.query({ client: trx }).where(
    'levelStageSkillId',
    skill.id
  )
  const existingById = new Map(existing.map((activity) => [activity.id, activity]))
  const keptIds = new Set<number>()

  for (const input of inputs) {
    const attrs = {
      name: input.name,
      description: input.description ?? null,
      applicationNotes: input.applicationNotes ?? null,
    }
    const target = input.id ? existingById.get(input.id) : undefined
    if (target) {
      target.useTransaction(trx)
      target.merge(attrs)
      await target.save()
      keptIds.add(target.id)
    } else {
      await skill.related('activities').create(attrs)
    }
  }

  const removedIds = existing.filter((activity) => !keptIds.has(activity.id)).map((a) => a.id)
  if (removedIds.length > 0) {
    const used = await ClassActivity.query({ client: trx })
      .whereIn('levelStageActivityId', removedIds)
      .first()
    if (used) {
      throw new ProgramAuthoringException('An activity in use by classes cannot be removed.')
    }
    await LevelStageActivity.query({ client: trx }).whereIn('id', removedIds).delete()
  }
}

async function assertSkillsUnused(
  skillIds: number[],
  trx: TransactionClientContract
): Promise<void> {
  if (skillIds.length === 0) {
    return
  }
  const usedSkill = await ClassSkill.query({ client: trx })
    .whereIn('levelStageSkillId', skillIds)
    .first()
  if (usedSkill) {
    throw new ProgramAuthoringException('A skill in use by classes cannot be removed.')
  }
  const usedActivity = await ClassActivity.query({ client: trx })
    .whereHas('levelStageActivity', (query) => query.whereIn('levelStageSkillId', skillIds))
    .first()
  if (usedActivity) {
    throw new ProgramAuthoringException('An activity in use by classes cannot be removed.')
  }
}

async function deleteSkills(skillIds: number[], trx: TransactionClientContract): Promise<void> {
  if (skillIds.length === 0) {
    return
  }
  await LevelStageActivity.query({ client: trx }).whereIn('levelStageSkillId', skillIds).delete()
  await LevelStageSkill.query({ client: trx }).whereIn('id', skillIds).delete()
}

async function reconcileSkills(
  stage: LevelStage,
  inputs: SkillInput[],
  trx: TransactionClientContract
): Promise<void> {
  const existing = await LevelStageSkill.query({ client: trx }).where('levelStageId', stage.id)
  const existingById = new Map(existing.map((skill) => [skill.id, skill]))
  const keptIds = new Set<number>()

  for (const input of inputs) {
    const attrs = {
      name: input.name,
      passCriteria: input.passCriteria,
      description: input.description ?? null,
    }
    const target = input.id ? existingById.get(input.id) : undefined
    let skill: LevelStageSkill
    if (target) {
      target.useTransaction(trx)
      target.merge(attrs)
      await target.save()
      keptIds.add(target.id)
      skill = target
    } else {
      skill = await stage.related('skills').create(attrs)
    }
    await reconcileActivities(skill, input.activities ?? [], trx)
  }

  const removedIds = existing.filter((skill) => !keptIds.has(skill.id)).map((s) => s.id)
  await assertSkillsUnused(removedIds, trx)
  await deleteSkills(removedIds, trx)
}

async function reconcileStages(
  level: Level,
  inputs: StageInput[],
  trx: TransactionClientContract,
  codes: CodeState
): Promise<void> {
  const existing = await LevelStage.query({ client: trx }).where('levelId', level.id)
  const existingById = new Map(existing.map((stage) => [stage.id, stage]))
  const keptIds = new Set<number>()

  // Positions are unique per level; park existing rows on temporary negative
  // positions so reorders cannot transiently collide.
  for (const [index, stage] of existing.entries()) {
    stage.useTransaction(trx)
    stage.position = -(index + 1)
    await stage.save()
  }

  const kept: { stage: LevelStage; input: StageInput }[] = []
  for (const input of inputs) {
    const target = input.id ? existingById.get(input.id) : undefined
    if (target) {
      keptIds.add(target.id)
      kept.push({ stage: target, input })
    }
  }

  // Delete removed stages (and their curriculum) before assigning final
  // positions, so their parked slots cannot conflict either.
  const removed = existing.filter((stage) => !keptIds.has(stage.id))
  if (removed.length > 0) {
    const removedIds = removed.map((stage) => stage.id)
    const usedStage = await SwimmingClass.query({ client: trx })
      .whereIn('levelStageId', removedIds)
      .first()
    if (usedStage) {
      throw new ProgramAuthoringException('A stage in use by classes cannot be removed.')
    }
    const nestedSkills = await LevelStageSkill.query({ client: trx }).whereIn(
      'levelStageId',
      removedIds
    )
    const nestedSkillIds = nestedSkills.map((skill) => skill.id)
    await assertSkillsUnused(nestedSkillIds, trx)
    await deleteSkills(nestedSkillIds, trx)
    await LevelStage.query({ client: trx }).whereIn('id', removedIds).delete()
  }

  for (const { stage, input } of kept) {
    stage.useTransaction(trx)
    stage.merge({
      name: input.name,
      position: input.position,
      description: input.description ?? null,
    })
    await stage.save()
    await reconcileSkills(stage, input.skills ?? [], trx)
  }

  for (const input of inputs) {
    if (input.id && existingById.has(input.id)) {
      continue
    }
    const stage = await level.related('stages').create({
      name: input.name,
      position: input.position,
      description: input.description ?? null,
      code: reserveStageCode(level.code, codes),
    })
    await reconcileSkills(stage, input.skills ?? [], trx)
  }
}

export default class ProgramAuthoringService {
  /**
   * Create a program and its levels in one transaction, converting each
   * level fee from cedis to minor units.
   */
  async create(data: StoreData, accountName: string): Promise<Program> {
    return db.transaction(async (trx) => {
      const programCodes = (await trx.from('programs').select('code')).map(
        (row: { code: unknown }) => String(row.code)
      )
      const program = await Program.create(
        {
          name: data.name,
          description: data.description,
          code: programCode(accountName, nextTierNumber(programCodes, 'program')),
        },
        { client: trx }
      )
      const codes = await loadCodeState(trx)
      for (const input of data.levels) {
        const level = await program.related('levels').create({
          name: input.name,
          ageGroup: input.ageGroup,
          description: input.description,
          defaultFee: toMinorUnits(input.defaultFee),
          capacity: input.capacity,
          code: reserveLevelCode(program.code, codes),
        })
        await reconcileStages(level, input.stages ?? [], trx, codes)
      }
      return program
    })
  }

  /**
   * Update a program and reconcile its levels: levels with an id belonging to
   * this program are updated, levels without one are created, and existing
   * levels absent from the payload are removed. Stage/skill/activity rows are
   * reconciled the same way because classes reference them.
   */
  async update(program: Program, data: UpdateData): Promise<Program> {
    return db.transaction(async (trx) => {
      program.useTransaction(trx)
      program.merge({ name: data.name, description: data.description })
      await program.save()

      const existing = await Level.query({ client: trx }).where('programId', program.id)
      const existingById = new Map(existing.map((level) => [level.id, level]))
      const keptIds = new Set<number>()
      const codes = await loadCodeState(trx)

      for (const input of data.levels) {
        const attrs = {
          name: input.name,
          ageGroup: input.ageGroup,
          description: input.description,
          defaultFee: toMinorUnits(input.defaultFee),
          capacity: input.capacity,
        }
        const target = input.id ? existingById.get(input.id) : undefined
        let level: Level
        if (target) {
          target.useTransaction(trx)
          target.merge(attrs)
          await target.save()
          keptIds.add(target.id)
          level = target
        } else {
          const created = new Level()
          created.programId = program.id
          created.merge({ ...attrs, code: reserveLevelCode(program.code, codes) })
          created.useTransaction(trx)
          await created.save()
          level = created
        }

        await reconcileStages(level, input.stages ?? [], trx, codes)
      }

      for (const level of existing) {
        if (!keptIds.has(level.id)) {
          const usedLevel = await SwimmingClass.query({ client: trx })
            .where('levelId', level.id)
            .first()
          if (usedLevel) {
            throw new ProgramAuthoringException('A level with classes cannot be removed.')
          }
          level.useTransaction(trx)
          await level.delete()
        }
      }

      return program
    })
  }
}
