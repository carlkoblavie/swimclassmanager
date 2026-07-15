import db from '@adonisjs/lucid/services/db'
import Program from '#models/program'
import Level from '#models/level'
import type { Infer } from '@vinejs/vine/types'
import type { storeProgramValidator, updateProgramValidator } from '#validators/program'

type StoreData = Infer<typeof storeProgramValidator>
type UpdateData = Infer<typeof updateProgramValidator>

function toMinorUnits(cedis: number): number {
  return Math.round(cedis * 100)
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
      await program.related('levels').createMany(
        data.levels.map((level) => ({
          name: level.name,
          ageGroup: level.ageGroup,
          description: level.description,
          defaultFee: toMinorUnits(level.defaultFee),
          capacity: level.capacity,
        }))
      )
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
        if (target) {
          target.useTransaction(trx)
          target.merge(attrs)
          await target.save()
          keptIds.add(target.id)
        } else {
          const created = new Level()
          created.programId = program.id
          created.merge(attrs)
          created.useTransaction(trx)
          await created.save()
        }
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
