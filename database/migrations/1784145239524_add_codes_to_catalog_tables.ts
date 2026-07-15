import { BaseSchema } from '@adonisjs/lucid/schema'
import { levelCode, programCode, stageCode } from '#values/account_code'

const TABLES = ['programs', 'levels', 'level_stages']

export default class extends BaseSchema {
  protected tableName = 'programs'

  async up() {
    for (const table of TABLES) {
      this.schema.alterTable(table, (builder) => {
        builder.string('code').nullable()
      })
    }

    // Backfill existing catalog rows with hierarchy codes. Pre-existing rows
    // cannot know their author's account, so the first organisation's
    // initials stand in (single-account reality today).
    this.defer(async (db) => {
      const organisation = await db.from('organisations').orderBy('id').first()
      const account = organisation ? String(organisation.name) : 'Account'

      const programs = await db.from('programs').orderBy('id').select('id')
      const programCodeById = new Map<number, string>()
      for (const [index, row] of programs.entries()) {
        const code = programCode(account, index + 1)
        programCodeById.set(Number(row.id), code)
        await db.from('programs').where('id', row.id).update({ code })
      }

      const levels = await db.from('levels').orderBy('id').select('id', 'program_id')
      const levelCodeById = new Map<number, string>()
      for (const [index, row] of levels.entries()) {
        const parent = programCodeById.get(Number(row.program_id)) ?? 'P00'
        const code = levelCode(parent, index + 1)
        levelCodeById.set(Number(row.id), code)
        await db.from('levels').where('id', row.id).update({ code })
      }

      const stages = await db.from('level_stages').orderBy('id').select('id', 'level_id')
      for (const [index, row] of stages.entries()) {
        const parent = levelCodeById.get(Number(row.level_id)) ?? 'L00'
        await db
          .from('level_stages')
          .where('id', row.id)
          .update({ code: stageCode(parent, index + 1) })
      }
    })

    for (const table of TABLES) {
      this.schema.alterTable(table, (builder) => {
        builder.dropNullable('code')
      })
    }
  }

  async down() {
    for (const table of TABLES) {
      this.schema.alterTable(table, (builder) => {
        builder.dropColumn('code')
      })
    }
  }
}
