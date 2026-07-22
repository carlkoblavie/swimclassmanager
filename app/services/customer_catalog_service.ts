import { DateTime } from 'luxon'
import Program from '#models/program'
import SwimYear from '#models/swim_year'
import type Level from '#models/level'
import type School from '#models/school'
import type SchoolLevelSetting from '#models/school_level_setting'
import type LevelStage from '#models/level_stage'
import type Term from '#models/term'

function money(minorUnits: number) {
  return {
    raw: minorUnits,
    currency: 'GHS',
    formatted: `GHS ${(minorUnits / 100).toFixed(2)}`,
  }
}

function dateOut(value: DateTime) {
  return {
    raw: value.toISODate() ?? '',
    formatted: value.toFormat('d LLL yyyy'),
  }
}

/**
 * Read model for the public customer purchase page: a school's available
 * levels (plans) grouped by program, priced with the school's effective fee,
 * alongside the current/upcoming swim year and its terms (billing is per term).
 */
export default class CustomerCatalogService {
  /** All active programs that have at least one available level for the school. */
  async plansFor(school: School) {
    const programs = await this.baseProgramQuery(school).orderBy('name')

    const programCards = programs
      .map((program) => this.programCard(program))
      .filter((program) => program.levels.length > 0)

    return {
      school: this.schoolBlock(school),
      swimYear: await this.currentSwimYear(school),
      programs: programCards,
    }
  }

  /** One active program (by public id) with its available levels. */
  async programPlanFor(school: School, programPublicId: string) {
    const program = await this.baseProgramQuery(school)
      .where('publicId', programPublicId)
      .firstOrFail()

    return {
      school: this.schoolBlock(school),
      swimYear: await this.currentSwimYear(school),
      program: this.programCard(program),
    }
  }

  private baseProgramQuery(school: School) {
    return Program.query()
      .withScopes((scopes) => scopes.active())
      .preload('levels', (levelsQuery) =>
        levelsQuery
          .preload('schoolLevelSettings', (settingsQuery) =>
            settingsQuery.where('schoolId', school.id)
          )
          .preload('stages', (stagesQuery) => stagesQuery.orderBy('position'))
          .orderBy('id')
      )
  }

  private schoolBlock(school: School) {
    return {
      name: school.name,
      slug: school.slug,
      organisationSlug: school.organisation?.slug ?? '',
    }
  }

  private programCard(program: Program) {
    const preloaded = program.$preloaded as { levels?: Level[] }
    const levels = (preloaded.levels ?? [])
      .map((level) => this.levelCard(level))
      .filter((card): card is NonNullable<typeof card> => card !== null)

    return {
      publicId: program.publicId,
      name: program.name,
      description: program.description,
      levels,
    }
  }

  // A level is purchasable when its school setting is available (or absent,
  // which defaults to available). Fee falls back to the level default.
  private levelCard(level: Level) {
    const preloaded = level.$preloaded as {
      schoolLevelSettings?: SchoolLevelSetting[]
      stages?: LevelStage[]
    }
    const setting = (preloaded.schoolLevelSettings ?? [])[0]
    const available = setting?.available ?? true
    if (!available) {
      return null
    }

    return {
      publicId: level.publicId,
      code: level.code,
      name: level.name,
      description: level.description,
      ageGroup: level.ageGroup,
      audience: level.audience,
      fee: money(setting?.fee ?? level.defaultFee),
      capacity: level.capacity,
      lessonsToComplete: level.classesCount,
      stageCount: (preloaded.stages ?? []).length,
    }
  }

  // The swim year the customer buys into: the ongoing one, else the next
  // upcoming. Terms are returned so the page can show per-term pricing.
  private async currentSwimYear(school: School) {
    const today = DateTime.now().toISODate()!
    const swimYears = await SwimYear.query()
      .where('schoolId', school.id)
      .where('endsOn', '>=', today)
      .preload('terms', (termsQuery) => termsQuery.orderBy('position'))
      .orderBy('startsOn')

    const swimYear = swimYears.find((year) => year.status === 'current') ?? swimYears[0]
    if (!swimYear) {
      return null
    }

    const preloaded = swimYear.$preloaded as { terms?: Term[] }
    return {
      name: swimYear.name,
      status: swimYear.status,
      startsOn: dateOut(swimYear.startsOn),
      endsOn: dateOut(swimYear.endsOn),
      terms: (preloaded.terms ?? []).map((term) => ({
        id: term.id,
        name: term.name,
        startsOn: dateOut(term.startsOn),
        endsOn: dateOut(term.endsOn),
      })),
    }
  }
}
