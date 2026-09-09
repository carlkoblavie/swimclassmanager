import type { HttpContext } from '@adonisjs/core/http'

type GuideStep = {
  title: string
  description: string
  points?: string[]
}

type Guide = {
  slug: string
  title: string
  intro: string
  steps: GuideStep[]
}

const guides: Guide[] = [
  {
    slug: 'create-lessons',
    title: 'Creating lessons for your class',
    intro:
      'As the lead instructor of a stage, you generate and plan the lessons for its classes. Assistant instructors can view everything but not change it.',
    steps: [
      {
        title: 'Find a class you lead',
        description:
          'Open Classes. Your classes are split into “Classes you lead” and “Classes you assist”. You can only create and plan lessons for classes you lead — the ones you assist are read-only.',
      },
      {
        title: 'Open the class and generate lessons',
        description:
          'Open a class you lead and click Generate lessons.',
      },
      {
        title: 'Set the schedule',
        description:
          'Pick the start date, the weekday the lessons repeat on, and the start time. The end date fills in automatically so exactly the class’s remaining lessons are created. Click Generate lessons.',
      },
      {
        title: 'Plan each lesson',
        description:
          'Click the pencil on a lesson to open the editor. Choose at least one objective (from the class goals) and at least one skill the lesson covers, then save. Date, time, and duration come from the class.',
      },
      {
        title: 'Add activities',
        description:
          'Add activities until they fill the full lesson duration (for example, 45 minutes). The lesson status updates as you go:',
        points: [
          'Not planned — no activities yet',
          'Partially planned — some activities, but under the duration',
          'Planned — activities fill the full duration',
        ],
      },
      {
        title: 'Repeat for every lesson',
        description:
          'Work through each lesson until it’s Planned, then move on to your next class.',
      },
    ],
  },
  {
    slug: 'stage-instructors',
    title: 'Assigning instructors to a stage (admins)',
    intro:
      'Instructors are staffed per stage, not per lesson. A stage has one lead and any number of assistants; every class and lesson in the stage follows that staffing.',
    steps: [
      {
        title: 'Open the stage',
        description: 'Go to Programs, open a level, and expand the stage you want to staff.',
      },
      {
        title: 'Manage instructors',
        description:
          'In the stage’s Instructors panel, click Manage.',
      },
      {
        title: 'Choose the lead and assistants',
        description:
          'Pick one lead instructor and any assistant instructors, then Save. The lead can generate and plan lessons for the stage’s classes; assistants get read-only access.',
      },
    ],
  },
]

export default class DocsController {
  index({ inertia }: HttpContext) {
    return inertia.render('docs', { guides })
  }
}
