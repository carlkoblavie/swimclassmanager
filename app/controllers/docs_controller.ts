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
  {
    slug: 'enrol-learners',
    title: 'Enrolling a learner into stages',
    intro:
      'Learners progress through a level one stage at a time. You assign them to the stages they’ll work through — no payment is required to enrol.',
    steps: [
      {
        title: 'Open Enrolment',
        description:
          'Go to Enrolment. Every signup appears here, whether or not they’ve paid. Use the tabs (All / Not assigned / Assigned), search, and level filter to find a learner.',
      },
      {
        title: 'Assign stages',
        description:
          'Click Assign stages on a learner. Drill down Program → Level, then pick the stages to assign. Stages must be chosen in order from the first — you can’t skip (no gaps like 1, 3, 5).',
      },
      {
        title: 'Review and confirm',
        description:
          'Click Review to see a summary of the program, level, and stages, then Confirm & save.',
      },
      {
        title: 'Edit or undo',
        description:
          'Reopen a learner with Edit stages to change the selection, or use Unassign inside that drawer to remove the assignment.',
      },
      {
        title: 'See a learner’s details',
        description:
          'Click a learner’s name to open their profile — it shows their level, assigned stages, and the lead and assistant instructors of their current stage.',
      },
    ],
  },
  {
    slug: 'take-attendance',
    title: 'Taking attendance',
    intro:
      'Once a lesson has been taught (today or earlier) you take attendance instead of editing it. The register lists the learners whose current stage is that lesson’s stage.',
    steps: [
      {
        title: 'Find a taught lesson',
        description:
          'On the Lessons page (or a class page), any lesson dated today or earlier shows a Take attendance button. Past lessons can no longer be edited or removed.',
      },
      {
        title: 'Open the register',
        description:
          'Click Take attendance. A panel slides in from the right with the lesson’s details at the top and the learners signed up for it.',
      },
      {
        title: 'Mark each learner',
        description:
          'Tap P (present), L (late), or A (absent) for each learner. Use All present to mark everyone at once, or Clear to start over. The running totals update as you go.',
      },
      {
        title: 'Save',
        description:
          'Click Save attendance. You can reopen the register anytime to update the marks.',
      },
    ],
  },
]

export default class DocsController {
  index({ inertia }: HttpContext) {
    return inertia.render('docs', { guides })
  }
}
