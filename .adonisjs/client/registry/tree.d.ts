/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  landing: typeof routes['landing']
  home: typeof routes['home']
  signInLinks: {
    create: typeof routes['sign_in_links.create']
    store: typeof routes['sign_in_links.store']
  }
  sessions: {
    store: typeof routes['sessions.store']
    destroy: typeof routes['sessions.destroy']
  }
  accountRegistrations: {
    create: typeof routes['account_registrations.create']
    store: typeof routes['account_registrations.store']
  }
  auth: {
    verify: typeof routes['auth.verify']
  }
  accounts: {
    edit: typeof routes['accounts.edit']
    update: typeof routes['accounts.update']
  }
  accountPasswords: {
    edit: typeof routes['account_passwords.edit']
    update: typeof routes['account_passwords.update']
  }
  schools: {
    create: typeof routes['schools.create']
    store: typeof routes['schools.store']
  }
  activeSchools: {
    update: typeof routes['active_schools.update']
  }
  invitations: {
    create: typeof routes['invitations.create']
    store: typeof routes['invitations.store']
  }
  memberships: {
    store: typeof routes['memberships.store']
  }
  signups: {
    create: typeof routes['signups.create']
    store: typeof routes['signups.store']
    index: typeof routes['signups.index']
  }
  customerPlans: {
    index: typeof routes['customer_plans.index']
    show: typeof routes['customer_plans.show']
  }
  api: {
    accounts: {
      store: typeof routes['api.accounts.store']
    }
  }
  programs: {
    index: typeof routes['programs.index']
    create: typeof routes['programs.create']
    store: typeof routes['programs.store']
    show: typeof routes['programs.show']
    edit: typeof routes['programs.edit']
    update: typeof routes['programs.update']
    destroy: typeof routes['programs.destroy']
  }
  levels: {
    show: typeof routes['levels.show']
  }
  levelSettings: {
    update: typeof routes['level_settings.update']
  }
  swimYears: {
    index: typeof routes['swim_years.index']
    store: typeof routes['swim_years.store']
    update: typeof routes['swim_years.update']
    destroy: typeof routes['swim_years.destroy']
  }
  swimmingClasses: {
    index: typeof routes['swimming_classes.index']
    store: typeof routes['swimming_classes.store']
    show: typeof routes['swimming_classes.show']
    edit: typeof routes['swimming_classes.edit']
    update: typeof routes['swimming_classes.update']
  }
  classLessons: {
    store: typeof routes['class_lessons.store']
    update: typeof routes['class_lessons.update']
    destroy: typeof routes['class_lessons.destroy']
  }
}
