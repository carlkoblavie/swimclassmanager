import { BaseTransformer } from '@adonisjs/core/transformers'
import type School from '#models/school'

export default class SchoolTransformer extends BaseTransformer<School> {
  toObject() {
    return this.pick(this.resource, ['id', 'organisationId', 'name', 'location', 'slug'])
  }
}
