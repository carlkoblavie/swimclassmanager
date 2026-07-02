import { BaseTransformer } from '@adonisjs/core/transformers'
import type Learner from '#models/learner'

export default class LearnerTransformer extends BaseTransformer<Learner> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'name',
        'gender',
        'nationality',
        'residentialLocation',
        'medicalInfo',
        'swimmingExperience',
      ]),
      dateOfBirth: {
        raw: this.resource.dateOfBirth.toISODate(),
        formatted: this.resource.dateOfBirth.toFormat('dd LLL yyyy'),
      },
    }
  }
}
