import { BaseTransformer } from '@adonisjs/core/transformers'
import type Skill from '#models/skill'

export default class SkillTransformer extends BaseTransformer<Skill> {
  toObject() {
    const isPlatformDefault = this.resource.isDefault && this.resource.schoolId === null

    return {
      ...this.pick(this.resource, ['id', 'schoolId', 'name', 'description', 'isDefault']),
      scope: isPlatformDefault ? ('platform' as const) : ('school' as const),
      editable: !isPlatformDefault,
    }
  }
}
