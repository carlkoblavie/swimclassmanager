import { BaseTransformer } from '@adonisjs/core/transformers'
import type Level from '#models/level'
import type SchoolLevelSetting from '#models/school_level_setting'

function formatCedis(minorUnits: number): string {
  return `GHS ${(minorUnits / 100).toFixed(2)}`
}

export default class LevelTransformer extends BaseTransformer<Level> {
  constructor(
    resource: Level,
    protected schoolId: number
  ) {
    super(resource)
  }

  toObject() {
    const settings = (this.resource.schoolLevelSettings ?? []) as unknown as SchoolLevelSetting[]
    const setting = settings[0]
    const effectiveFee = setting?.fee ?? this.resource.defaultFee
    const available = setting?.available ?? true

    return {
      ...this.pick(this.resource, ['id', 'name', 'ageGroup', 'description', 'capacity']),
      defaultFee: {
        raw: this.resource.defaultFee,
        formatted: formatCedis(this.resource.defaultFee),
      },
      fee: { raw: effectiveFee, formatted: formatCedis(effectiveFee) },
      available,
    }
  }
}
