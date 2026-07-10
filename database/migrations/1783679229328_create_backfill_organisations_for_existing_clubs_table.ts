import { BaseSchema } from '@adonisjs/lucid/schema'

type ClubRow = {
  id: number
  name: string
  created_by_user_id: number
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'organisation'
}

export default class extends BaseSchema {
  protected tableName = 'clubs'

  async up() {
    this.defer(async (db) => {
      const clubs = (await db
        .from(this.tableName)
        .select('id', 'name', 'created_by_user_id')
        .orderBy('created_by_user_id')
        .orderBy('id')) as ClubRow[]

      const organisationByCreator = new Map<number, number>()
      const now = new Date().toISOString()

      for (const club of clubs) {
        let organisationId = organisationByCreator.get(club.created_by_user_id)

        if (!organisationId) {
          const name = `${club.name} Organisation`
          const baseSlug = slugify(name)
          let slug = baseSlug
          let suffix = 2

          while (await db.from('organisations').where('slug', slug).first()) {
            slug = `${baseSlug}-${suffix}`
            suffix += 1
          }

          const [insertedId] = await db.table('organisations').insert({
            name,
            slug,
            is_premium: false,
            created_by_user_id: club.created_by_user_id,
            created_at: now,
            updated_at: null,
          })

          organisationId = Number(insertedId)
          organisationByCreator.set(club.created_by_user_id, organisationId)
        }

        await db
          .from(this.tableName)
          .where('id', club.id)
          .update({ organisation_id: organisationId })
      }
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.dropNullable('organisation_id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.setNullable('organisation_id')
    })

    this.defer(async (db) => {
      await db.from(this.tableName).update({ organisation_id: null })
      await db.from('organisations').delete()
    })
  }
}
