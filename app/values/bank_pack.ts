import { LessonActivityCategoryPurpose } from '#values/lesson_activity_category_purpose'
import { LessonActivityLeader } from '#values/lesson_activity_leader'

export const BankPackKey = {
  EXTENDED_DEVELOPMENT: 'extended_development',
} as const

export type BankPackKey = (typeof BankPackKey)[keyof typeof BankPackKey]

export type BankPackDefinition = {
  key: BankPackKey
  name: string
  description: string
  version: string
  planTier: 'pro'
  skills: {
    key: string
    family: string
    name: string
    description: string
    passCriteria: string
  }[]
  activities: {
    key: string
    categoryName: string
    categoryPurpose: number
    name: string
    focusArea: string
    ledBy: number
    durationMinutes: number
    description: string
    equipment?: string
    safetyNotes?: string
    successCue: string
    progressionEasier?: string
    progressionHarder?: string
    ageGroupKeys: string[]
    skillKeys: string[]
  }[]
}

export const DEFAULT_BANK_PACKS: BankPackDefinition[] = [
  {
    key: BankPackKey.EXTENDED_DEVELOPMENT,
    name: 'Extended Development Pack',
    description:
      'A Pro bank pack with additional safety, breathing, propulsion, and stroke-development content.',
    version: '0.1',
    planTier: 'pro',
    skills: [],
    activities: [
      {
        key: 'tread_and_talk',
        categoryName: 'Core Skills',
        categoryPurpose: LessonActivityCategoryPurpose.CORE_SKILLS,
        name: 'Tread and Talk',
        focusArea: 'Deep-water survival',
        ledBy: LessonActivityLeader.INSTRUCTOR,
        durationMinutes: 8,
        description:
          'Learners tread water while answering short questions to build calm endurance.',
        equipment: 'Deep-water marker or lane rope',
        safetyNotes: 'Use close spotting and shorten intervals for early deep-water learners.',
        successCue: 'Keeps head calm and body upright while responding.',
        progressionEasier: 'Use wall support between short treading attempts.',
        progressionHarder: 'Add longer answers or remove rest between attempts.',
        ageGroupKeys: ['six_to_seventeen', 'adult'],
        skillKeys: [],
      },
      {
        key: 'side_breathing_3s',
        categoryName: 'Drills',
        categoryPurpose: LessonActivityCategoryPurpose.DRILLS,
        name: 'Side Breathing 3s',
        focusArea: 'Breathing rhythm',
        ledBy: LessonActivityLeader.MIXED,
        durationMinutes: 7,
        description: 'Learners breathe every third stroke while keeping one goggle in the water.',
        equipment: 'Kickboard optional',
        safetyNotes: 'Use short repeats with relaxed recovery at the wall.',
        successCue: 'Turns to the side without lifting the head forward.',
        progressionEasier: 'Practise side kick breathing with a board.',
        progressionHarder: 'Remove board support and add full-arm timing.',
        ageGroupKeys: ['six_to_seventeen', 'adult'],
        skillKeys: [],
      },
      {
        key: 'dolphin_wave_line',
        categoryName: 'Challenge',
        categoryPurpose: LessonActivityCategoryPurpose.CHALLENGE,
        name: 'Dolphin Wave Line',
        focusArea: 'Body wave propulsion',
        ledBy: LessonActivityLeader.LEARNER,
        durationMinutes: 6,
        description: 'Learners move through short markers using small dolphin kicks.',
        equipment: 'Pool markers',
        safetyNotes: 'Keep the distance short and avoid breath-holding contests.',
        successCue: 'Keeps the wave small, connected, and controlled.',
        progressionEasier: 'Use vertical dolphin pulses at the wall.',
        progressionHarder: 'Add streamline arms through the markers.',
        ageGroupKeys: ['six_to_seventeen'],
        skillKeys: [],
      },
    ],
  },
]

export function bankPackSkillSourceKey(packKey: string, skillKey: string) {
  return `${packKey}:skill:${skillKey}`
}

export function bankPackActivitySourceKey(packKey: string, activityKey: string) {
  return `${packKey}:activity:${activityKey}`
}
