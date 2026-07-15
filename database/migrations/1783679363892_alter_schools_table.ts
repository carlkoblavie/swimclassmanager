import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    const hasClubs = await this.schema.hasTable('clubs')
    const hasSchools = await this.schema.hasTable('schools')

    if (hasClubs && !hasSchools) {
      this.schema.raw('DROP INDEX IF EXISTS clubs_slug_unique')
      this.schema.renameTable('clubs', 'schools')
    }

    if (hasClubs || hasSchools) {
      this.schema.raw(
        'CREATE UNIQUE INDEX IF NOT EXISTS schools_organisation_slug_unique ON schools (organisation_id, slug)'
      )
    }

    const hasClubLevelSettings = await this.schema.hasTable('club_level_settings')
    const hasSchoolLevelSettings = await this.schema.hasTable('school_level_settings')

    if (hasClubLevelSettings && !hasSchoolLevelSettings) {
      this.schema.renameTable('club_level_settings', 'school_level_settings')
    }

    for (const tableName of ['memberships', 'invitations', 'signups']) {
      if (await this.schema.hasColumn(tableName, 'club_id')) {
        this.schema.alterTable(tableName, (table) => {
          table.renameColumn('club_id', 'school_id')
        })
      }
    }

    const shouldRenameLevelSettingsColumn =
      (hasClubLevelSettings && !hasSchoolLevelSettings) ||
      (hasSchoolLevelSettings && (await this.schema.hasColumn('school_level_settings', 'club_id')))

    if (shouldRenameLevelSettingsColumn) {
      this.schema.alterTable('school_level_settings', (table) => {
        table.renameColumn('club_id', 'school_id')
      })
    }
  }

  async down() {
    for (const tableName of ['memberships', 'invitations', 'signups']) {
      if (await this.schema.hasColumn(tableName, 'school_id')) {
        this.schema.alterTable(tableName, (table) => {
          table.renameColumn('school_id', 'club_id')
        })
      }
    }

    if (await this.schema.hasColumn('school_level_settings', 'school_id')) {
      this.schema.alterTable('school_level_settings', (table) => {
        table.renameColumn('school_id', 'club_id')
      })
    }

    const hasSchoolLevelSettings = await this.schema.hasTable('school_level_settings')
    const hasClubLevelSettings = await this.schema.hasTable('club_level_settings')

    if (hasSchoolLevelSettings && !hasClubLevelSettings) {
      this.schema.renameTable('school_level_settings', 'club_level_settings')
    }

    const hasSchools = await this.schema.hasTable('schools')
    const hasClubs = await this.schema.hasTable('clubs')

    if (hasSchools) {
      this.schema.raw('DROP INDEX IF EXISTS schools_organisation_slug_unique')
    }

    if (hasSchools && !hasClubs) {
      this.schema.renameTable('schools', 'clubs')
    }

    if (hasSchools || hasClubs) {
      this.schema.raw('CREATE UNIQUE INDEX IF NOT EXISTS clubs_slug_unique ON clubs (slug)')
    }
  }
}
