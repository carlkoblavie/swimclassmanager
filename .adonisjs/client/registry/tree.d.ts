/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  landing: typeof routes['landing']
  home: typeof routes['home']
  release: {
    index: typeof routes['release.index']
  }
  docs: {
    index: typeof routes['docs.index']
  }
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
  members: {
    index: typeof routes['members.index']
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
    update: typeof routes['signups.update']
  }
  customerPlans: {
    index: typeof routes['customer_plans.index']
    show: typeof routes['customer_plans.show']
  }
  customerPurchases: {
    store: typeof routes['customer_purchases.store']
    verify: typeof routes['customer_purchases.verify']
  }
  api: {
    accounts: {
      store: typeof routes['api.accounts.store']
    }
  }
  paystackWebhooks: {
    store: typeof routes['paystack_webhooks.store']
  }
  enrolment: {
    index: typeof routes['enrolment.index']
    place: typeof routes['enrolment.place']
    withdraw: typeof routes['enrolment.withdraw']
  }
  learners: {
    show: typeof routes['learners.show']
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
  schoolAgeGroups: {
    store: typeof routes['school_age_groups.store']
    update: typeof routes['school_age_groups.update']
    destroy: typeof routes['school_age_groups.destroy']
  }
  skillBank: {
    index: typeof routes['skill_bank.index']
    store: typeof routes['skill_bank.store']
    update: typeof routes['skill_bank.update']
    destroy: typeof routes['skill_bank.destroy']
  }
  bankPacks: {
    index: typeof routes['bank_packs.index']
    update: typeof routes['bank_packs.update']
  }
  skillBankFamilies: {
    store: typeof routes['skill_bank_families.store']
    update: typeof routes['skill_bank_families.update']
    destroy: typeof routes['skill_bank_families.destroy']
  }
  activityBank: {
    index: typeof routes['activity_bank.index']
    store: typeof routes['activity_bank.store']
    update: typeof routes['activity_bank.update']
    destroy: typeof routes['activity_bank.destroy']
  }
  activityBankCategories: {
    update: typeof routes['activity_bank_categories.update']
    destroy: typeof routes['activity_bank_categories.destroy']
  }
  swimmingClasses: {
    index: typeof routes['swimming_classes.index']
    store: typeof routes['swimming_classes.store']
    show: typeof routes['swimming_classes.show']
    edit: typeof routes['swimming_classes.edit']
    update: typeof routes['swimming_classes.update']
    duplicate: typeof routes['swimming_classes.duplicate']
  }
  classLessons: {
    store: typeof routes['class_lessons.store']
    update: typeof routes['class_lessons.update']
    activitiesUpdate: typeof routes['class_lessons.activities_update']
    copyActivities: typeof routes['class_lessons.copy_activities']
    updatePlan: typeof routes['class_lessons.update_plan']
    destroy: typeof routes['class_lessons.destroy']
  }
  lessons: {
    index: typeof routes['lessons.index']
    store: typeof routes['lessons.store']
  }
  stages: {
    assignInstructors: typeof routes['stages.assign_instructors']
  }
}
