import vine from '@vinejs/vine'
import { LESSON_ACTIVITY_LEADER_VALUES } from '#values/lesson_activity_leader'

export const storeSkillBankSkillValidator = vine.create({
  familyKey: vine.string().trim().minLength(1).maxLength(120),
  name: vine.string().trim().minLength(1).maxLength(120),
  description: vine.string().trim().maxLength(2000).nullable().optional(),
  passCriteria: vine.string().trim().maxLength(255).nullable().optional(),
})

export const updateSkillBankSkillValidator = vine.create({
  familyKey: vine.string().trim().minLength(1).maxLength(120),
  name: vine.string().trim().minLength(1).maxLength(120),
  description: vine.string().trim().maxLength(2000).nullable().optional(),
  passCriteria: vine.string().trim().maxLength(255).nullable().optional(),
})

export const storeSkillBankFamilyValidator = vine.create({
  displayName: vine.string().trim().minLength(1).maxLength(80),
})

export const updateSkillBankFamilyValidator = vine.create({
  displayName: vine.string().trim().minLength(1).maxLength(80),
})

export const storeSchoolActivityValidator = vine.create({
  schoolActivityCategoryId: vine
    .number()
    .withoutDecimals()
    .positive()
    .exists({ table: 'school_activity_categories', column: 'id' }),
  name: vine.string().trim().minLength(1).maxLength(120),
  focusArea: vine.string().trim().maxLength(255).nullable().optional(),
  ledBy: vine.number().withoutDecimals().in(LESSON_ACTIVITY_LEADER_VALUES),
  durationMinutes: vine.number().withoutDecimals().positive().nullable().optional(),
  description: vine.string().trim().maxLength(2000).nullable().optional(),
  equipment: vine.string().trim().maxLength(255).nullable().optional(),
  safetyNotes: vine.string().trim().maxLength(2000).nullable().optional(),
  successCue: vine.string().trim().maxLength(255).nullable().optional(),
  progressionEasier: vine.string().trim().maxLength(2000).nullable().optional(),
  progressionHarder: vine.string().trim().maxLength(2000).nullable().optional(),
  ageGroupIds: vine.array(vine.number().withoutDecimals().positive()).distinct().optional(),
  skillBankSkillIds: vine.array(vine.number().withoutDecimals().positive()).distinct().optional(),
})

export const updateSchoolActivityValidator = vine.create({
  schoolActivityCategoryId: vine
    .number()
    .withoutDecimals()
    .positive()
    .exists({ table: 'school_activity_categories', column: 'id' }),
  name: vine.string().trim().minLength(1).maxLength(120),
  focusArea: vine.string().trim().maxLength(255).nullable().optional(),
  ledBy: vine.number().withoutDecimals().in(LESSON_ACTIVITY_LEADER_VALUES),
  durationMinutes: vine.number().withoutDecimals().positive().nullable().optional(),
  description: vine.string().trim().maxLength(2000).nullable().optional(),
  equipment: vine.string().trim().maxLength(255).nullable().optional(),
  safetyNotes: vine.string().trim().maxLength(2000).nullable().optional(),
  successCue: vine.string().trim().maxLength(255).nullable().optional(),
  progressionEasier: vine.string().trim().maxLength(2000).nullable().optional(),
  progressionHarder: vine.string().trim().maxLength(2000).nullable().optional(),
  ageGroupIds: vine.array(vine.number().withoutDecimals().positive()).distinct().optional(),
  skillBankSkillIds: vine.array(vine.number().withoutDecimals().positive()).distinct().optional(),
})

export const updateSchoolAgeGroupValidator = vine.create({
  displayName: vine.string().trim().minLength(1).maxLength(80),
  minAgeYear: vine.number().withoutDecimals().min(0).nullable().optional(),
  maxAgeYear: vine.number().withoutDecimals().min(0).nullable().optional(),
  isActive: vine.boolean().optional(),
})

export const storeSchoolAgeGroupValidator = vine.create({
  displayName: vine.string().trim().minLength(1).maxLength(80),
  minAgeYear: vine.number().withoutDecimals().min(0).nullable().optional(),
  maxAgeYear: vine.number().withoutDecimals().min(0).nullable().optional(),
  isActive: vine.boolean().optional(),
})

export const updateSchoolActivityCategoryValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(80),
})
