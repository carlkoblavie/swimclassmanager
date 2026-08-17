import type { HttpContext } from '@adonisjs/core/http'

const release = {
  version: 'v0.2',
  releasedOn: '17 August 2026',
  intro: 'The main teaching, enrolment, and term-payment workflow is now in one place.',
  entries: [
    {
      kind: 'NEW' as const,
      title: 'Curriculum stages and skills',
      description:
        'Organise programmes into levels and stages, define stage skills with pass criteria, and reuse curriculum content as classes progress.',
    },
    {
      kind: 'NEW' as const,
      title: 'Skills and activity banks',
      description:
        'Build school-managed skills, skill families, activities, categories, age groups, and bank packs for consistent lesson planning.',
    },
    {
      kind: 'NEW' as const,
      title: 'Stage-based class setup',
      description:
        'Create classes within a curriculum stage with their level, term, skills, duration, capacity, and class-specific options.',
    },
    {
      kind: 'NEW' as const,
      title: 'Lesson generation across a term',
      description:
        'Generate a date range of lessons with recurring weekdays, duration, previews, and continuous lesson numbers that do not restart each month.',
    },
    {
      kind: 'NEW' as const,
      title: 'Lesson activities and copying',
      description:
        'Add bank or custom activities, equipment, objectives, notes, observations, and conclusions, then copy activities into empty lessons in the same stage.',
    },
    {
      kind: 'NEW' as const,
      title: 'Lesson list and detail views',
      description:
        'Review lessons by class, level, stage, date, activity status, and instructor in list or calendar view, with focused detail and editing screens.',
    },
    {
      kind: 'NEW' as const,
      title: 'Instructor staffing',
      description:
        'Invite instructors and assistant coaches, assign lead and supporting instructors, bulk-assign staffing, and see assignments on lessons.',
    },
    {
      kind: 'NEW' as const,
      title: 'Learner enrolment workspace',
      description:
        'Work from Unplaced, Enrolled, or All learners, search and filter by level, and place one learner or a group into a class.',
    },
    {
      kind: 'NEW' as const,
      title: 'Choose the lessons a learner attends',
      description:
        "Select the learner's lessons during enrolment, set the date they join, and keep attendance and progress tied to that starting point.",
    },
    {
      kind: 'NEW' as const,
      title: 'Class changes and make-ups',
      description:
        'Move learners between classes, change selected lessons, add a make-up lesson, or withdraw a learner while retaining their record.',
    },
    {
      kind: 'NEW' as const,
      title: 'Term-based payment tracking',
      description:
        'Track pending invoices, sent invoices, part-paid terms, paid terms, and closed enquiries with payment records tied to the school term.',
    },
    {
      kind: 'NEW' as const,
      title: 'Part payments and enrolment',
      description:
        'Record a payment amount for a learner and term, see the remaining balance, and continue placing learners even when the term is only part paid.',
    },
    {
      kind: 'IMPROVED' as const,
      title: 'Dashboard and daily priorities',
      description:
        "See sign-ups, enrolments, lessons, instructors, revenue, today's schedule, overdue invoices, unstaffed lessons, and other work needing attention.",
    },
    {
      kind: 'IMPROVED' as const,
      title: 'Skills shown with pass criteria',
      description:
        'Lesson skills now use numbered tiles with clear pass criteria, making assessment easier to scan during and after a lesson.',
    },
    {
      kind: 'IMPROVED' as const,
      title: 'Safer roles and actions',
      description:
        'Instructor, manager, and administrator access is reflected in the available screens and actions, including lesson generation and learner withdrawal.',
    },
    {
      kind: 'IMPROVED' as const,
      title: 'Cancelled class handling',
      description:
        'Cancelled classes stay out of active lesson generation and new learner placement, keeping schedules and enrolments consistent.',
    },
  ],
}

export default class ReleaseController {
  index({ inertia }: HttpContext) {
    return inertia.render('release', { release })
  }
}
