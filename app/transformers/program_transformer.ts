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
    const preloaded = this.resource.$preloaded as { levels?: Level[] }
    const levels = preloaded.levels ?? this.resource.levels ?? []

    return {
      ...this.pick(this.resource, ['id', 'name', 'description']),
      isActive: this.resource.isActive,
      levels: LevelTransformer.transform(levels, this.schoolId),
    }
  }

  forEdit() {
    const preloaded = this.resource.$preloaded as { levels?: Level[] }
    const levels = preloaded.levels ?? this.resource.levels ?? []
    return {
      ...this.pick(this.resource, ['id', 'name', 'description']),
      levels: levels.map((level) => ({
        id: level.id,
        name: level.name,
        ageGroup: level.ageGroup,
        description: level.description,
        capacity: level.capacity,
        defaultFee: level.defaultFee / 100,
        stages: (level.stages ?? []).map((stage) => ({
          name: stage.name,
          position: stage.position,
          description: stage.description,
          skills: (stage.skills ?? []).map((skill) => ({
            name: skill.name,
            passCriteria: skill.passCriteria,
            description: skill.description,
            activities: (skill.activities ?? []).map((activity) => ({
              name: activity.name,
              description: activity.description,
              applicationNotes: activity.applicationNotes,
            })),
          })),
        })),
      })),
    }
  }
}
