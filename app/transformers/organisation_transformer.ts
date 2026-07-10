import { BaseTransformer } from '@adonisjs/core/transformers'
import type Organisation from '#models/organisation'

export default class OrganisationTransformer extends BaseTransformer<Organisation> {
  toObject() {
    return this.pick(this.resource, ['id', 'name', 'slug', 'isPremium'])
  }
}
