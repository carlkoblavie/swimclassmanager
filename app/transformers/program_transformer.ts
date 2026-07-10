import { BaseTransformer } from '@adonisjs/core/transformers'
import LevelTransformer from '#transformers/level_transformer'
import type Program from '#models/program'
import type Level from '#models/level'

export default class ProgramTransformer extends BaseTransformer<Program> {
  constructor(
    resource: Program,
    protected schoolId: number
  ) {
    super(resource)
  }

  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'description']),
      levels: LevelTransformer.transform(this.whenLoaded(this.resource.levels), this.schoolId),
    }
  }

  forEdit() {
    const levels = (this.resource.levels ?? []) as unknown as Level[]
    return {
      ...this.pick(this.resource, ['id', 'name', 'description']),
      levels: levels.map((level) => ({
        id: level.id,
        name: level.name,
        ageGroup: level.ageGroup,
        description: level.description,
        capacity: level.capacity,
        defaultFee: level.defaultFee / 100,
      })),
    }
  }
}
