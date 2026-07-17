import { BaseTransformer } from '@adonisjs/core/transformers'
import type { DateTime } from 'luxon'
import type SwimYear from '#models/swim_year'
import type Term from '#models/term'

function dateOut(value: DateTime) {
  return {
    raw: value.toISODate() ?? '',
    formatted: value.toFormat('d LLL yyyy'),
  }
}

export default class SwimYearTransformer extends BaseTransformer<SwimYear> {
  toObject() {
    const preloaded = this.resource.$preloaded as { terms?: Term[] }
    const terms = (preloaded.terms ?? []).toSorted((a, b) => a.position - b.position)

    const termData = terms.map((term) => ({
      id: term.id,
      name: term.name,
      position: term.position,
      startsOn: dateOut(term.startsOn),
      endsOn: dateOut(term.endsOn),
      classCount: Number(term.$extras.swimmingClasses_count ?? 0),
    }))

    return {
      ...this.pick(this.resource, ['id', 'name']),
      startsOn: dateOut(this.resource.startsOn),
      endsOn: dateOut(this.resource.endsOn),
      status: this.resource.status,
      terms: termData,
      classCount: termData.reduce((total, term) => total + term.classCount, 0),
    }
  }
}
