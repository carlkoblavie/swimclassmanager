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
    title: 'How to create lessons',
    intro: 'Generate a class’s lessons, then plan each one from goals to activities.',
    steps: [
      {
        title: 'Open the class',
        description: 'Go to Programs and browse to the class you want.',
      },
      {
        title: 'Set the lesson limit',
        description:
          'Click the pencil icon to edit the class. Max Lessons defaults to 5 — change it to the number of lessons you want for that class, then Save changes.',
      },
      {
        title: 'Start generating',
        description: 'Click Generate Lessons.',
      },
      {
        title: 'Set the schedule',
        description:
          'Select the start date the lessons should begin, choose a lesson day and a start time, then click Generate Lessons. The specified number of lessons is created automatically.',
      },
      {
        title: 'Plan each lesson',
        description:
          'Click the pencil icon on a lesson to open the editor. Select at least one objective (from the class goals), at least one skill, and assign the instructor(s), then save.',
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
        title: 'Move to the next class',
        description:
          'Repeat steps 5–6 until every lesson is planned, then go back to step 1 and pick another class.',
      },
    ],
  },
]

export default class DocsController {
  index({ inertia }: HttpContext) {
    return inertia.render('docs', { guides })
  }
}
