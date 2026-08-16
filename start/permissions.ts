import { definePermissions } from '@adonisplus/permissions'
import { RoleName } from '#values/role'

export const permissions = definePermissions({
  invitation: {
    create: 'Invite members to the school',
  },
  signup: {
    view: 'View learn-to-swim sign-ups',
  },
  enrolment: {
    view: 'View learner enrolments',
    place: 'Place learners into classes',
    withdraw: 'Withdraw learners from classes',
  },
  lesson: {
    'generate': 'Generate class lessons',
    'edit': 'Edit lesson details',
    'activities.manage': 'Add and edit lesson activities',
    'instructors.manage': 'Assign lesson instructors',
    'instructors.bulk_manage': 'Assign instructors to multiple lessons',
  },
  program: {
    manage: 'Manage swim programs and levels',
  },
  class: {
    view: 'View swimming classes and sessions',
    manage: 'Manage swimming classes and sessions',
  },
  school: {
    create: 'Create schools in an organisation',
  },
  settings: {
    manage: 'Manage school settings, swim years, and terms',
  },
})

export type PermissionKey = ReturnType<typeof permissions.keys>[number]

/**
 * Which permission keys each role holds. Consumed by the seed migration
 * (real environments) and the `seedRoles` test helper.
 */
export const rolePermissions: Record<string, PermissionKey[]> = {
  [RoleName.ADMINISTRATOR]: [
    permissions.getKey('invitation.create'),
    permissions.getKey('signup.view'),
    permissions.getKey('enrolment.view'),
    permissions.getKey('enrolment.place'),
    permissions.getKey('lesson.edit'),
    permissions.getKey('lesson.activities.manage'),
    permissions.getKey('lesson.instructors.manage'),
    permissions.getKey('lesson.instructors.bulk_manage'),
    permissions.getKey('program.manage'),
    permissions.getKey('class.view'),
    permissions.getKey('class.manage'),
    permissions.getKey('school.create'),
    permissions.getKey('settings.manage'),
  ],
  [RoleName.HEAD_COACH]: [
    permissions.getKey('invitation.create'),
    permissions.getKey('signup.view'),
    permissions.getKey('enrolment.view'),
    permissions.getKey('enrolment.place'),
    permissions.getKey('program.manage'),
    permissions.getKey('lesson.edit'),
    permissions.getKey('lesson.activities.manage'),
    permissions.getKey('lesson.instructors.manage'),
    permissions.getKey('lesson.instructors.bulk_manage'),
    permissions.getKey('class.view'),
    permissions.getKey('class.manage'),
    permissions.getKey('school.create'),
    permissions.getKey('settings.manage'),
  ],
  [RoleName.TEACHER]: [
    permissions.getKey('class.view'),
    permissions.getKey('enrolment.view'),
    permissions.getKey('lesson.activities.manage'),
  ],
  [RoleName.ASSISTANT_COACH]: [
    permissions.getKey('class.view'),
    permissions.getKey('enrolment.view'),
    permissions.getKey('lesson.edit'),
    permissions.getKey('lesson.activities.manage'),
    permissions.getKey('lesson.instructors.manage'),
  ],
  [RoleName.DECK_SUPERVISOR]: [permissions.getKey('class.view')],
  [RoleName.PARENT]: [permissions.getKey('class.view')],
  [RoleName.STUDENT]: [permissions.getKey('class.view')],
}
