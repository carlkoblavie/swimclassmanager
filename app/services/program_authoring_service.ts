import db from '@adonisjs/lucid/services/db'
import Program from '#models/program'
import Level from '#models/level'
import LevelStage from '#models/level_stage'
import LevelStageActivity from '#models/level_stage_activity'
import LevelStageSkill from '#models/level_stage_skill'
import type { Infer } from '@vinejs/vine/types'
import type { storeProgramValidator, updateProgramValidator } from '#validators/program'

type StoreData = Infer<typeof storeProgramValidator>
type UpdateData = Infer<typeof updateProgramValidator>

function toMinorUnits(cedis: number): number {
  return Math.round(cedis * 100)
}

type StageInput = NonNullable<StoreData['levels'][number]['stages']>[number]

async function createStages(level: Level, stages: StageInput[]): Promise<void> {
  for (const input of stages) {
    const stage = await level.related('stages').create({
      name: input.name,
      position: input.position,
      description: input.description ?? null,
    })
    for (const skillInput of input.skills ?? []) {
      const skill = await stage.related('skills').create({
        name: skillInput.name,
        passCriteria: skillInput.passCriteria,
        description: skillInput.description ?? null,
      })
      await skill.related('activities').createMany(
        (skillInput.activities ?? []).map((activity) => ({
          name: activity.name,
          description: activity.description ?? null,
          applicationNotes: activity.applicationNotes ?? null,
        }))
      )
    }
  }
}

export default class ProgramAuthoringService {
  /**
   * Create a program and its levels in one transaction, converting each
   * level fee from cedis to minor units.
   */
  async create(data: StoreData): Promise<Program> {
    return db.transaction(async (trx) => {
      const program = await Program.create(
        { name: data.name, description: data.description },
        { client: trx }
      )
      for (const input of data.levels) {
        const level = await program.related('levels').create({
          name: input.name,
          ageGroup: input.ageGroup,
          description: input.description,
          defaultFee: toMinorUnits(input.defaultFee),
          capacity: input.capacity,
        })
        await createStages(level, input.stages ?? [])
      }
      return program
    })
  }

  /**
   * Update a program and reconcile its levels: levels with an id belonging to
   * this program are updated, levels without one are created, and existing
   * levels absent from the payload are removed. All in one transaction.
   */
  async update(program: Program, data: UpdateData): Promise<Program> {
    return db.transaction(async (trx) => {
      program.useTransaction(trx)
      program.merge({ name: data.name, description: data.description })
      await program.save()

      const existing = await Level.query({ client: trx }).where('programId', program.id)
      const existingById = new Map(existing.map((level) => [level.id, level]))
      const keptIds = new Set<number>()

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
          created.merge(attrs)
          created.useTransaction(trx)
          await created.save()
          level = created
        }

        // Stages (with their skills and activities) are replaced wholesale
        // from the submitted set.
        const existingStages = await LevelStage.query({ client: trx }).where('levelId', level.id)
        const stageIds = existingStages.map((stage) => stage.id)
        if (stageIds.length > 0) {
          const existingSkills = await LevelStageSkill.query({ client: trx }).whereIn(
            'levelStageId',
            stageIds
          )
          const skillIds = existingSkills.map((skill) => skill.id)
          if (skillIds.length > 0) {
            await LevelStageActivity.query({ client: trx })
              .whereIn('levelStageSkillId', skillIds)
              .delete()
          }
          await LevelStageSkill.query({ client: trx }).whereIn('levelStageId', stageIds).delete()
        }
        await LevelStage.query({ client: trx }).where('levelId', level.id).delete()
        await createStages(level, input.stages ?? [])
      }

      for (const level of existing) {
        if (!keptIds.has(level.id)) {
          level.useTransaction(trx)
          await level.delete()
        }
      }

      return program
    })
  }
}
