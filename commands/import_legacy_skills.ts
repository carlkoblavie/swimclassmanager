import { BaseCommand, flags } from '@adonisjs/core/ace'
import School from '#models/school'
import SkillBankFamilyService from '#services/skill_bank_family_service'
import SkillBankService from '#services/skill_bank_service'

export default class ImportLegacySkills extends BaseCommand {
  static commandName = 'skills:import-legacy'
  static description = 'Import existing stage skills into each school skills bank'
  static options = { startApp: true }

  @flags.number({
    description: 'Import legacy skills into one school bank',
  })
  declare schoolId?: number

  @flags.boolean({
    description: 'Import legacy skills into every school bank',
  })
  declare all: boolean

  async run() {
    const schools = await this.schoolsToImport()
    if (schools.length === 0) {
      this.logger.info('No schools found.')
      return
    }

    const bank = new SkillBankService()
    const families = new SkillBankFamilyService()
    await bank.ensureDefaults()

    let totalImported = 0
    let totalSkipped = 0
    for (const school of schools) {
      await families.ensureDefaults(school.id)
      const summary = await bank.syncLegacyStageSkills(school.id)
      totalImported += summary.imported
      totalSkipped += summary.skipped

      this.logger.info(`${school.name}: imported ${summary.imported}, skipped ${summary.skipped}`)
    }

    this.logger.success(
      `Legacy skills import complete. Imported ${totalImported}, skipped ${totalSkipped}.`
    )
  }

  private async schoolsToImport(): Promise<School[]> {
    if (this.schoolId) {
      return [await School.findOrFail(this.schoolId)]
    }

    const schools = await School.query().orderBy('id')
    if (this.all || schools.length <= 1) {
      return schools
    }

    this.logger.error('Multiple schools found. Pass --school-id=<id> or --all.')
    this.exitCode = 1
    return []
  }
}
