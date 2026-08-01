import { BaseTransformer } from '@adonisjs/core/transformers'
import type SchoolActivity from '#models/school_activity'
import type SchoolActivityCategory from '#models/school_activity_category'

export default class SchoolActivityCategoryTransformer extends BaseTransformer<SchoolActivityCategory> {
  toObject() {
    const preloaded = this.resource.$preloaded as { activities?: SchoolActivity[] }
    const activities = preloaded.activities ?? []

    return {
      ...this.pick(this.resource, ['id', 'schoolId', 'name', 'purpose', 'position']),
      activities: activities.map((activity) => ({
        ...this.pick(activity, [
          'id',
          'schoolId',
          'schoolActivityCategoryId',
          'name',
          'focusArea',
          'ledBy',
          'description',
          'equipment',
          'safetyNotes',
          'successCue',
          'progressionEasier',
          'progressionHarder',
          'durationMinutes',
          'position',
        ]),
      })),
    }
  }
}
