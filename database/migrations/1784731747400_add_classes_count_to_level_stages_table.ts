import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'level_stages'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('classes_count').unsigned().nullable()
    })

    this.defer(async (db) => {
      const levels = await db.from('levels').select('id', 'classes_count')

      for (const level of levels) {
        const total = Number(level.classes_count)
        if (!Number.isFinite(total) || total < 0) {
          continue
        }

        const stages = await db
          .from(this.tableName)
          .where('level_id', level.id)
          .orderBy('position')
          .select('id')

        if (stages.length === 0) {
          continue
        }

        const base = Math.floor(total / stages.length)
        const remainder = total % stages.length

        for (const [index, stage] of stages.entries()) {
          await db
            .from(this.tableName)
            .where('id', stage.id)
            .update({ classes_count: base + (index < remainder ? 1 : 0) })
        }
      }
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('classes_count')
    })
  }
}
