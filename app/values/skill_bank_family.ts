export const SkillBankFamilyKey = {
  WATER_COMFORT_ORIENTATION: 'water_comfort_orientation',
  WATER_SAFETY_SURVIVAL: 'water_safety_survival',
  PROPULSION: 'propulsion',
  STROKE_TECHNIQUE: 'stroke_technique',
} as const

export type SkillBankFamilyKey = (typeof SkillBankFamilyKey)[keyof typeof SkillBankFamilyKey]

export const DEFAULT_SKILL_BANK_FAMILIES = [
  {
    familyKey: SkillBankFamilyKey.WATER_COMFORT_ORIENTATION,
    displayName: 'Water Comfort / Orientation',
  },
  {
    familyKey: SkillBankFamilyKey.WATER_SAFETY_SURVIVAL,
    displayName: 'Water Safety / Survival',
  },
  { familyKey: SkillBankFamilyKey.PROPULSION, displayName: 'Propulsion' },
  { familyKey: SkillBankFamilyKey.STROKE_TECHNIQUE, displayName: 'Stroke Technique' },
]

export const LEGACY_SKILL_BANK_FAMILY_KEYS = new Map([
  ...DEFAULT_SKILL_BANK_FAMILIES.map(
    (family) => [family.displayName.toLowerCase(), family.familyKey] as const
  ),
  ['water comfort orientation', SkillBankFamilyKey.WATER_COMFORT_ORIENTATION],
  ['water_comfort_orientation', SkillBankFamilyKey.WATER_COMFORT_ORIENTATION],
  ['water confidence', SkillBankFamilyKey.WATER_COMFORT_ORIENTATION],
  ['water_confidence', SkillBankFamilyKey.WATER_COMFORT_ORIENTATION],
  ['breathing', SkillBankFamilyKey.WATER_COMFORT_ORIENTATION],
  ['body position', SkillBankFamilyKey.WATER_SAFETY_SURVIVAL],
  ['body_position', SkillBankFamilyKey.WATER_SAFETY_SURVIVAL],
  ['water safety survival', SkillBankFamilyKey.WATER_SAFETY_SURVIVAL],
  ['water_safety_survival', SkillBankFamilyKey.WATER_SAFETY_SURVIVAL],
  ['safety', SkillBankFamilyKey.WATER_SAFETY_SURVIVAL],
  ['stroke basics', SkillBankFamilyKey.STROKE_TECHNIQUE],
  ['stroke_basics', SkillBankFamilyKey.STROKE_TECHNIQUE],
  ['stroke technique', SkillBankFamilyKey.STROKE_TECHNIQUE],
  ['stroke_technique', SkillBankFamilyKey.STROKE_TECHNIQUE],
])
