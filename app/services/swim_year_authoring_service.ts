import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { DateTime } from 'luxon'
import SwimYearAuthoringException from '#exceptions/swim_year_authoring_exception'
import type School from '#models/school'
import SwimYear from '#models/swim_year'
import SwimmingClass from '#models/swimming_class'
import Term from '#models/term'
import type { SwimYearInput } from '#validators/swim_year'

type TermDraft = {
  id?: number
  name: string
  position: number
  startsOn: DateTime
  endsOn: DateTime
}

export default class SwimYearAuthoringService {
  /**
   * Create a swim year with its terms. The name is strictly system-generated
   * from the years the date range spans (e.g. 2025/2026).
   */
  async create(school: School, data: SwimYearInput): Promise<SwimYear> {
    return db.transaction(async (trx) => {
      const name = this.yearName(data.startsOn, data.endsOn)
      const terms = this.resolveTerms(data)
      await this.assertNameAvailable(school.id, name, trx)

      const swimYear = new SwimYear()
      swimYear.useTransaction(trx)
      swimYear.merge({
        schoolId: school.id,
        name,
        startsOn: data.startsOn,
        endsOn: data.endsOn,
      })
      await swimYear.save()
      await swimYear.related('terms').createMany(terms.map(({ id: _id, ...term }) => term))
      return swimYear
    })
  }

  /**
   * Update a swim year and sync its terms: submitted terms carrying an id are
   * updated in place, new ones created, and missing ones removed (refused
   * while classes are tied to them).
   */
  async update(swimYear: SwimYear, data: SwimYearInput): Promise<SwimYear> {
    return db.transaction(async (trx) => {
      const name = this.yearName(data.startsOn, data.endsOn)
      const terms = this.resolveTerms(data)
      await this.assertNameAvailable(swimYear.schoolId, name, trx, swimYear.id)

      const existing = await Term.query({ client: trx }).where('swimYearId', swimYear.id)
      const existingById = new Map(existing.map((term) => [term.id, term]))

      swimYear.useTransaction(trx)
      swimYear.merge({ name, startsOn: data.startsOn, endsOn: data.endsOn })
      await swimYear.save()

      const keptIds = new Set<number>()
      for (const draft of terms) {
        if (draft.id) {
          const term = existingById.get(draft.id)
          if (!term) {
            throw new SwimYearAuthoringException('A term does not belong to this swim year.')
          }
          term.useTransaction(trx)
          term.merge({
            name: draft.name,
            position: draft.position,
            startsOn: draft.startsOn,
            endsOn: draft.endsOn,
          })
          await term.save()
          keptIds.add(term.id)
        } else {
          await swimYear.related('terms').create({
            name: draft.name,
            position: draft.position,
            startsOn: draft.startsOn,
            endsOn: draft.endsOn,
          })
        }
      }

      for (const term of existing) {
        if (keptIds.has(term.id)) {
          continue
        }
        await this.assertTermUnused(term, trx, 'Remove or reassign its classes first.')
        term.useTransaction(trx)
        await term.delete()
      }

      return swimYear
    })
  }

  /** Delete a swim year and its terms; refused while classes are tied. */
  async destroy(swimYear: SwimYear): Promise<void> {
    await db.transaction(async (trx) => {
      const terms = await Term.query({ client: trx }).where('swimYearId', swimYear.id)
      for (const term of terms) {
        await this.assertTermUnused(
          term,
          trx,
          'Remove or reassign its classes before deleting the swim year.'
        )
        term.useTransaction(trx)
        await term.delete()
      }
      swimYear.useTransaction(trx)
      await swimYear.delete()
    })
  }

  /** Auto-name from the years spanned: "2026" or "2026/2027". */
  protected yearName(startsOn: DateTime, endsOn: DateTime): string {
    return startsOn.year === endsOn.year ? String(startsOn.year) : `${startsOn.year}/${endsOn.year}`
  }

  /**
   * Order terms by start date, assign positions, and enforce that each term
   * sits inside the year and does not overlap its neighbours.
   */
  protected resolveTerms(data: SwimYearInput): TermDraft[] {
    const sorted = [...data.terms].sort((a, b) => a.startsOn.toMillis() - b.startsOn.toMillis())

    return sorted.map((term, index) => {
      if (term.startsOn < data.startsOn || term.endsOn > data.endsOn) {
        throw new SwimYearAuthoringException(`"${term.name}" must fall within the swim year dates.`)
      }
      const previous = sorted[index - 1]
      if (previous && term.startsOn <= previous.endsOn) {
        throw new SwimYearAuthoringException(
          `"${term.name}" overlaps "${previous.name}"; terms cannot overlap.`
        )
      }
      return {
        id: term.id,
        name: term.name,
        position: index + 1,
        startsOn: term.startsOn,
        endsOn: term.endsOn,
      }
    })
  }

  protected async assertNameAvailable(
    schoolId: number,
    name: string,
    trx: TransactionClientContract,
    excludeId?: number
  ): Promise<void> {
    const query = SwimYear.query({ client: trx }).where('schoolId', schoolId).where('name', name)
    if (excludeId) {
      query.whereNot('id', excludeId)
    }
    if (await query.first()) {
      throw new SwimYearAuthoringException(`A ${name} swim year already exists.`)
    }
  }

  protected async assertTermUnused(
    term: Term,
    trx: TransactionClientContract,
    hint: string
  ): Promise<void> {
    const tied = await SwimmingClass.query({ client: trx }).where('termId', term.id).first()
    if (tied) {
      throw new SwimYearAuthoringException(`"${term.name}" has classes tied to it. ${hint}`)
    }
  }
}
