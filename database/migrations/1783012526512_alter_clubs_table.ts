import { BaseSchema } from '@adonisjs/lucid/schema'
import string from '@adonisjs/core/helpers/string'

export default class extends BaseSchema {
  protected tableName = 'clubs'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('slug').nullable()
    })

    this.defer(async (db) => {
      const clubs = await db.from('clubs').select('id', 'name').orderBy('id', 'asc')
      const used = new Set<string>()

      for (const club of clubs) {
        const base = string.slug(club.name, { lower: true, strict: true })
        let slug = base
        let suffix = 2
        while (used.has(slug)) {
          slug = `${base}-${suffix}`
          suffix++
        }
        used.add(slug)
        await db.from('clubs').where('id', club.id).update({ slug })
      }
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.dropNullable('slug')
      table.unique(['slug'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('slug')
    })
  }
}
