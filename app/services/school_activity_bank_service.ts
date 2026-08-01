import db from '@adonisjs/lucid/services/db'
import SchoolActivity from '#models/school_activity'
import SchoolActivityCategory from '#models/school_activity_category'
import { LessonActivityCategoryPurpose } from '#values/lesson_activity_category_purpose'
import {
  LessonActivityLeader,
  type LessonActivityLeader as LessonActivityLeaderValue,
} from '#values/lesson_activity_leader'

type StarterCategory = {
  name: string
  purpose: number
  activities: {
    name: string
    focusArea: string
    ledBy: LessonActivityLeaderValue
    durationMinutes: number
    description: string
    equipment?: string
    safetyNotes?: string
    successCue: string
    progressionEasier?: string
    progressionHarder?: string
  }[]
}

const STARTER_BANK: StarterCategory[] = [
  {
    name: 'Warm Up',
    purpose: LessonActivityCategoryPurpose.WARM_UP,
    activities: [
      {
        name: 'Bubble Trail',
        focusArea: 'Breathing confidence',
        ledBy: LessonActivityLeader.MIXED,
        durationMinutes: 4,
        description: 'Learners move along the wall or lane line while blowing steady bubbles.',
        equipment: 'Wall or lane marker',
        safetyNotes: 'Keep learners within arm reach in shallow water.',
        successCue: 'Relaxed face in water with steady bubbles.',
        progressionEasier: 'Hold the wall and bubble in place.',
        progressionHarder: 'Bubble while moving between two markers.',
      },
      {
        name: 'Traffic Lights',
        focusArea: 'Listening and movement control',
        ledBy: LessonActivityLeader.INSTRUCTOR,
        durationMinutes: 5,
        description: 'Learners move on green, pause and float on amber, and return to wall on red.',
        equipment: 'Coloured cones or hand signals',
        safetyNotes: 'Keep the route short enough for confident returns.',
        successCue: 'Stops safely, floats, and returns to the wall on cue.',
      },
      {
        name: 'Animal Walks',
        focusArea: 'Coordination and water comfort',
        ledBy: LessonActivityLeader.LEARNER,
        durationMinutes: 5,
        description: 'Learners walk, hop, and glide like animals across shallow water.',
        equipment: 'None',
        safetyNotes: 'Use shallow water and avoid racing.',
        successCue: 'Moves freely while maintaining balance.',
      },
    ],
  },
  {
    name: 'Start',
    purpose: LessonActivityCategoryPurpose.START,
    activities: [
      {
        name: 'Safe Sit Entry',
        focusArea: 'Safe pool entry',
        ledBy: LessonActivityLeader.INSTRUCTOR,
        durationMinutes: 4,
        description:
          'Learners wait for permission, sit, turn toward the wall, and enter with control.',
        equipment: 'Pool edge',
        safetyNotes: 'One learner enters at a time.',
        successCue: 'Waits, sits, turns, and enters calmly.',
      },
      {
        name: 'Jump, Turn, Return',
        focusArea: 'Entry recovery',
        ledBy: LessonActivityLeader.INSTRUCTOR,
        durationMinutes: 6,
        description: 'Learners jump in, turn toward the wall, and return without panicking.',
        equipment: 'Pool edge',
        safetyNotes: 'Use an instructor spotter and appropriate depth.',
        successCue: 'Returns to the wall without instructor support.',
        progressionEasier: 'Step in from the edge before jumping.',
        progressionHarder: 'Add a short kick back to the wall.',
      },
      {
        name: 'Wall Push Rocket',
        focusArea: 'Streamline start',
        ledBy: LessonActivityLeader.MIXED,
        durationMinutes: 5,
        description: 'Learners push from the wall in a long body shape before adding kicks.',
        equipment: 'Pool wall',
        safetyNotes: 'Confirm the lane is clear before each push.',
        successCue: 'Pushes in a long shape and glides before kicking.',
      },
    ],
  },
  {
    name: 'Core Skills',
    purpose: LessonActivityCategoryPurpose.CORE_SKILLS,
    activities: [
      {
        name: 'Starfish Front Float',
        focusArea: 'Buoyancy',
        ledBy: LessonActivityLeader.INSTRUCTOR,
        durationMinutes: 7,
        description: 'Learners stretch into a wide front float and recover safely to standing.',
        equipment: 'Optional noodle support',
        safetyNotes: 'Support under shoulders or hands for nervous learners.',
        successCue: 'Holds a calm front float and recovers without grabbing.',
        progressionEasier: 'Use noodle support under the chest.',
        progressionHarder: 'Float without support for three seconds.',
      },
      {
        name: 'Back Float Sandwich',
        focusArea: 'Back balance',
        ledBy: LessonActivityLeader.INSTRUCTOR,
        durationMinutes: 7,
        description: 'Learners practise back float shape with ears in and hips lifted.',
        equipment: 'Optional kickboard or noodle',
        safetyNotes: 'Keep face clear and support the head for anxious learners.',
        successCue: 'Keeps ears in, hips high, and breathing calm.',
      },
      {
        name: 'Pencil Glide',
        focusArea: 'Streamline body position',
        ledBy: LessonActivityLeader.MIXED,
        durationMinutes: 6,
        description: 'Learners make a narrow pencil shape and glide from a gentle push.',
        equipment: 'Pool wall',
        safetyNotes: 'Space learners before push-offs.',
        successCue: 'Glides in a straight long body before kicking.',
      },
      {
        name: 'Kick Engine',
        focusArea: 'Propulsion',
        ledBy: LessonActivityLeader.MIXED,
        durationMinutes: 8,
        description: 'Learners practise small fast kicks while maintaining a long body line.',
        equipment: 'Kickboard optional',
        safetyNotes: 'Watch for fatigue and reduce distance as needed.',
        successCue: 'Kicks from the hips with soft knees.',
      },
      {
        name: 'Roll to Breathe',
        focusArea: 'Rotation and breath timing',
        ledBy: LessonActivityLeader.INSTRUCTOR,
        durationMinutes: 8,
        description: 'Learners rotate the body to breathe instead of lifting the head.',
        equipment: 'Optional board',
        safetyNotes: 'Use short repeats with frequent recovery.',
        successCue: 'Turns body and head together without lifting forward.',
      },
    ],
  },
  {
    name: 'Drills',
    purpose: LessonActivityCategoryPurpose.DRILLS,
    activities: [
      {
        name: 'Kickboard Builder',
        focusArea: 'Leg endurance',
        ledBy: LessonActivityLeader.LEARNER,
        durationMinutes: 6,
        description: 'Learners kick short repeats with a board while preserving body alignment.',
        equipment: 'Kickboards',
        safetyNotes: 'Keep repeats short and rest between efforts.',
        successCue: 'Maintains line and consistent kick rhythm.',
      },
      {
        name: 'Three Bubble Breaths',
        focusArea: 'Breath rhythm',
        ledBy: LessonActivityLeader.MIXED,
        durationMinutes: 5,
        description: 'Learners repeat three controlled bubble exhales and recover calmly.',
        equipment: 'None',
        safetyNotes: 'Do not force submersion.',
        successCue: 'Repeats controlled exhale and relaxed inhale.',
      },
      {
        name: 'Catch-Up Arms',
        focusArea: 'Stroke timing',
        ledBy: LessonActivityLeader.INSTRUCTOR,
        durationMinutes: 7,
        description: 'Learners alternate arms with one hand waiting in front before the next pull.',
        equipment: 'Optional pull buoy',
        safetyNotes: 'Use with swimmers ready for basic stroke work.',
        successCue: 'Long reach and patient arm timing.',
      },
      {
        name: 'Treasure Pickup',
        focusArea: 'Submersion',
        ledBy: LessonActivityLeader.LEARNER,
        durationMinutes: 6,
        description: 'Learners collect objects from shallow water after blowing bubbles.',
        equipment: 'Sinkable toys',
        safetyNotes: 'Use shallow water and limit attempts.',
        successCue: 'Blows bubbles before reaching down.',
      },
    ],
  },
  {
    name: 'Challenge',
    purpose: LessonActivityCategoryPurpose.CHALLENGE,
    activities: [
      {
        name: 'Island Hopping',
        focusArea: 'Confidence and movement planning',
        ledBy: LessonActivityLeader.LEARNER,
        durationMinutes: 6,
        description: 'Learners move between floating markers using safe chosen movement patterns.',
        equipment: 'Floating markers',
        safetyNotes: 'Keep islands close enough for successful travel.',
        successCue: 'Plans a route and reaches each marker calmly.',
      },
      {
        name: 'Rescue the Toy',
        focusArea: 'Aquatic survival',
        ledBy: LessonActivityLeader.MIXED,
        durationMinutes: 7,
        description: 'Learners retrieve a floating toy and return it to safety.',
        equipment: 'Floating toys',
        safetyNotes: 'Avoid long distances for early swimmers.',
        successCue: 'Reaches, kicks, returns, and holds the wall.',
      },
      {
        name: 'Streamline Race',
        focusArea: 'Body shape under pressure',
        ledBy: LessonActivityLeader.LEARNER,
        durationMinutes: 5,
        description: 'Learners race short glides while keeping streamline shape before speed.',
        equipment: 'Wall and markers',
        safetyNotes: 'Race one pair at a time with clear space.',
        successCue: 'Keeps shape while adding speed.',
      },
    ],
  },
  {
    name: 'Conclusion',
    purpose: LessonActivityCategoryPurpose.CONCLUSION,
    activities: [
      {
        name: 'Favorite Skill Repeat',
        focusArea: 'Confidence finish',
        ledBy: LessonActivityLeader.LEARNER,
        durationMinutes: 3,
        description: 'Each learner repeats one skill they felt proud of during the lesson.',
        equipment: 'None',
        safetyNotes: 'Choose skills suitable for each learner.',
        successCue: 'Leaves with one successful repetition.',
      },
      {
        name: 'Calm Back Float',
        focusArea: 'Regulation and recovery',
        ledBy: LessonActivityLeader.MIXED,
        durationMinutes: 4,
        description: 'Learners finish with supported or independent calm back floating.',
        equipment: 'Optional noodle',
        safetyNotes: 'Support head and shoulders for anxious learners.',
        successCue: 'Settles breathing before exit.',
      },
      {
        name: 'Wall Recap',
        focusArea: 'Reflection',
        ledBy: LessonActivityLeader.INSTRUCTOR,
        durationMinutes: 3,
        description: 'Learners hold the wall and name one thing they practised or improved.',
        equipment: 'None',
        safetyNotes: 'Keep learners stationary at the wall.',
        successCue: 'Names one lesson focus or success.',
      },
    ],
  },
]

export default class SchoolActivityBankService {
  async forSchool(schoolId: number): Promise<SchoolActivityCategory[]> {
    await this.ensureStarterBank(schoolId)

    return SchoolActivityCategory.query()
      .where('schoolId', schoolId)
      .where('isActive', true)
      .preload('activities', (activityQuery) =>
        activityQuery.where('isActive', true).orderBy('position').orderBy('name')
      )
      .orderBy('position')
      .orderBy('name')
  }

  async ensureStarterBank(schoolId: number): Promise<void> {
    const existing = await SchoolActivityCategory.query().where('schoolId', schoolId).first()
    if (existing) {
      return
    }

    await db.transaction(async (trx) => {
      for (const [categoryIndex, categoryTemplate] of STARTER_BANK.entries()) {
        const category = new SchoolActivityCategory()
        category.useTransaction(trx)
        category.merge({
          schoolId,
          name: categoryTemplate.name,
          purpose: categoryTemplate.purpose,
          position: categoryIndex + 1,
          isActive: true,
        })
        await category.save()

        await SchoolActivity.createMany(
          categoryTemplate.activities.map((activity, activityIndex) => ({
            schoolId,
            schoolActivityCategoryId: category.id,
            name: activity.name,
            focusArea: activity.focusArea,
            ledBy: activity.ledBy,
            description: activity.description,
            equipment: activity.equipment ?? null,
            safetyNotes: activity.safetyNotes ?? null,
            successCue: activity.successCue,
            progressionEasier: activity.progressionEasier ?? null,
            progressionHarder: activity.progressionHarder ?? null,
            durationMinutes: activity.durationMinutes,
            position: activityIndex + 1,
            isActive: true,
          })),
          { client: trx }
        )
      }
    })
  }
}
