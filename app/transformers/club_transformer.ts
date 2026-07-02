import { BaseTransformer } from '@adonisjs/core/transformers'
import type Club from '#models/club'

export default class ClubTransformer extends BaseTransformer<Club> {
  toObject() {
    return this.pick(this.resource, ['id', 'name', 'location', 'slug'])
  }
}
