import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class AccountTransformer extends BaseTransformer<User> {
  toObject() {
    return this.pick(this.resource, ['id', 'email', 'fullName', 'phone', 'country'])
  }
}
