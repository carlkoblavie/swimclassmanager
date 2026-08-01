import { BaseTransformer } from '@adonisjs/core/transformers'
import type Level from '#models/level'
import type LevelStage from '#models/level_stage'
import type Program from '#models/program'
import type SchoolLevelSetting from '#models/school_level_setting'

function formatCedis(minorUnits: number): string {
  return `GHS ${(minorUnits / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default class LevelTransformer extends BaseTransformer<Level> {
  constructor(
    resource: Level,
    protected schoolId: number
  ) {
    super(resource)
  }

  toObject() {
    const preloaded = this.resource.$preloaded as {
      schoolLevelSettings?: SchoolLevelSetting[]
      stages?: LevelStage[]
    }
    const settings = preloaded.schoolLevelSettings ?? this.resource.schoolLevelSettings ?? []
    const setting = settings[0]
    const effectiveFee = setting?.fee ?? this.resource.defaultFee
    const available = setting?.available ?? true
    const stages = preloaded.stages ?? []

    return {
      ...this.pick(this.resource, [
        'id',
        'publicId',
        'programId',
        'code',
        'name',
        'ageGroup',
        'description',
        'capacity',
        'classesCount',
        'audience',
      ]),
      defaultFee: {
        raw: this.resource.defaultFee,
        formatted: formatCedis(this.resource.defaultFee),
      },
      fee: { raw: effectiveFee, formatted: formatCedis(effectiveFee) },
      available,
      stages: stages.map((stage) => ({
        id: stage.id,
        code: stage.code,
        name: stage.name,
        position: stage.position,
        classesCount: stage.classesCount,
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
    }
  }

  forClassOption() {
    const preloaded = this.resource.$preloaded as { program?: Program }
    const program = preloaded.program ?? this.resource.program

    return {
      ...this.toObject(),
      programName: program?.name ?? '',
    }
  }
}
