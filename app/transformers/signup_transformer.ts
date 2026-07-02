import { BaseTransformer } from '@adonisjs/core/transformers'
import LearnerTransformer from '#transformers/learner_transformer'
import type Signup from '#models/signup'

export default class SignupTransformer extends BaseTransformer<Signup> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'contactName',
        'contactEmail',
        'contactPhone',
        'whatsapp',
        'message',
      ]),
      createdAt: {
        raw: this.resource.createdAt.toISO(),
        formatted: this.resource.createdAt.toFormat('dd LLL yyyy'),
      },
      learners: LearnerTransformer.transform(this.whenLoaded(this.resource.learners)),
    }
  }
}
