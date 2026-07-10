import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    if (await this.schema.hasColumn(this.tableName, 'active_club_id')) {
      this.schema.alterTable(this.tableName, (table) => {
        table.renameColumn('active_club_id', 'active_school_id')
      })
    }

    if (!(await this.schema.hasColumn(this.tableName, 'active_organisation_id'))) {
      this.schema.alterTable(this.tableName, (table) => {
        table
          .integer('active_organisation_id')
          .unsigned()
          .nullable()
          .references('organisations.id')
          .onDelete('SET NULL')
        table.index('active_organisation_id', 'users_active_organisation_id_index')
      })
    }

    this.defer(async (db) => {
      const users = await db
        .from(this.tableName)
        .select('id', 'active_school_id')
        .whereNotNull('active_school_id')

      for (const user of users) {
        const school = await db
          .from('schools')
          .select('organisation_id')
          .where('id', user.active_school_id)
          .first()

        if (school) {
          await db
            .from(this.tableName)
            .where('id', user.id)
            .update({ active_organisation_id: school.organisation_id })
        }
      }
    })
  }

  async down() {
    if (await this.schema.hasColumn(this.tableName, 'active_organisation_id')) {
      this.schema.alterTable(this.tableName, (table) => {
        table.dropIndex(['active_organisation_id'], 'users_active_organisation_id_index')
        table.dropColumn('active_organisation_id')
      })
    }

    if (await this.schema.hasColumn(this.tableName, 'active_school_id')) {
      this.schema.alterTable(this.tableName, (table) => {
        table.renameColumn('active_school_id', 'active_club_id')
      })
    }
  }
}
