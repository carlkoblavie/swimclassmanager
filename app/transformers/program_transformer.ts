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
      ...this.pick(this.resource, ['id', 'code', 'name', 'description']),
      isActive: this.resource.isActive,
      levels: LevelTransformer.transform(levels, this.schoolId),
    }
  }

  forEdit() {
    const preloaded = this.resource.$preloaded as { levels?: Level[] }
    const levels = preloaded.levels ?? this.resource.levels ?? []
    return {
      ...this.pick(this.resource, ['id', 'code', 'name', 'description']),
      levels: levels.map((level) => ({
        id: level.id,
        code: level.code,
        name: level.name,
        ageGroup: level.ageGroup,
        description: level.description,
        defaultFee: level.defaultFee / 100,
        stages: (level.stages ?? []).map((stage) => ({
          id: stage.id,
          code: stage.code,
          name: stage.name,
          position: stage.position,
          description: stage.description,
          skills: (stage.skills ?? []).map((skill) => ({
            id: skill.id,
            name: skill.name,
            passCriteria: skill.passCriteria,
            description: skill.description,
            activities: (skill.activities ?? []).map((activity) => ({
              id: activity.id,
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
