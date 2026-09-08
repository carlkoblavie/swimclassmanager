import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'landing': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'release.index': { paramsTuple?: []; params?: {} }
    'docs.index': { paramsTuple?: []; params?: {} }
    'sign_in_links.create': { paramsTuple?: []; params?: {} }
    'sessions.store': { paramsTuple?: []; params?: {} }
    'sign_in_links.store': { paramsTuple?: []; params?: {} }
    'account_registrations.create': { paramsTuple?: []; params?: {} }
    'account_registrations.store': { paramsTuple?: []; params?: {} }
    'auth.verify': { paramsTuple?: []; params?: {} }
    'accounts.edit': { paramsTuple?: []; params?: {} }
    'accounts.update': { paramsTuple?: []; params?: {} }
    'account_passwords.edit': { paramsTuple?: []; params?: {} }
    'account_passwords.update': { paramsTuple?: []; params?: {} }
    'sessions.destroy': { paramsTuple?: []; params?: {} }
    'schools.create': { paramsTuple?: []; params?: {} }
    'schools.store': { paramsTuple?: []; params?: {} }
    'active_schools.update': { paramsTuple?: []; params?: {} }
    'members.index': { paramsTuple?: []; params?: {} }
    'invitations.create': { paramsTuple?: []; params?: {} }
    'invitations.store': { paramsTuple?: []; params?: {} }
    'memberships.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'signups.create': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'signups.store': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'customer_plans.index': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'customer_purchases.store': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'customer_purchases.verify': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'customer_plans.show': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue,'programId': ParamValue} }
    'api.accounts.store': { paramsTuple?: []; params?: {} }
    'paystack_webhooks.store': { paramsTuple?: []; params?: {} }
    'signups.index': { paramsTuple?: []; params?: {} }
    'signups.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'enrolment.index': { paramsTuple?: []; params?: {} }
    'learners.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'enrolment.place': { paramsTuple?: []; params?: {} }
    'enrolment.withdraw': { paramsTuple?: []; params?: {} }
    'programs.index': { paramsTuple?: []; params?: {} }
    'programs.create': { paramsTuple?: []; params?: {} }
    'programs.store': { paramsTuple?: []; params?: {} }
    'programs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programs.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programs.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programs.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'levels.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'level_settings.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swim_years.index': { paramsTuple?: []; params?: {} }
    'swim_years.store': { paramsTuple?: []; params?: {} }
    'swim_years.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swim_years.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'school_age_groups.store': { paramsTuple?: []; params?: {} }
    'school_age_groups.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'school_age_groups.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'skill_bank.index': { paramsTuple?: []; params?: {} }
    'skill_bank.store': { paramsTuple?: []; params?: {} }
    'skill_bank.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'skill_bank.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bank_packs.index': { paramsTuple?: []; params?: {} }
    'bank_packs.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'skill_bank_families.store': { paramsTuple?: []; params?: {} }
    'skill_bank_families.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'skill_bank_families.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'activity_bank.index': { paramsTuple?: []; params?: {} }
    'activity_bank.store': { paramsTuple?: []; params?: {} }
    'activity_bank.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'activity_bank.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'activity_bank_categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'activity_bank_categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swimming_classes.index': { paramsTuple?: []; params?: {} }
    'swimming_classes.store': { paramsTuple?: []; params?: {} }
    'swimming_classes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swimming_classes.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swimming_classes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swimming_classes.duplicate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'class_lessons.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'lessons.index': { paramsTuple?: []; params?: {} }
    'lessons.store': { paramsTuple?: []; params?: {} }
    'class_lessons.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'class_lessons.activities_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'class_lessons.copy_activities': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'class_lessons.assign_instructors': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'class_lessons.bulk_assign_instructors': { paramsTuple?: []; params?: {} }
    'class_lessons.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'landing': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'release.index': { paramsTuple?: []; params?: {} }
    'docs.index': { paramsTuple?: []; params?: {} }
    'sign_in_links.create': { paramsTuple?: []; params?: {} }
    'account_registrations.create': { paramsTuple?: []; params?: {} }
    'auth.verify': { paramsTuple?: []; params?: {} }
    'accounts.edit': { paramsTuple?: []; params?: {} }
    'account_passwords.edit': { paramsTuple?: []; params?: {} }
    'schools.create': { paramsTuple?: []; params?: {} }
    'members.index': { paramsTuple?: []; params?: {} }
    'invitations.create': { paramsTuple?: []; params?: {} }
    'memberships.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'signups.create': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'customer_plans.index': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'customer_purchases.verify': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'customer_plans.show': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue,'programId': ParamValue} }
    'signups.index': { paramsTuple?: []; params?: {} }
    'enrolment.index': { paramsTuple?: []; params?: {} }
    'learners.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programs.index': { paramsTuple?: []; params?: {} }
    'programs.create': { paramsTuple?: []; params?: {} }
    'programs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programs.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'levels.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swim_years.index': { paramsTuple?: []; params?: {} }
    'skill_bank.index': { paramsTuple?: []; params?: {} }
    'bank_packs.index': { paramsTuple?: []; params?: {} }
    'activity_bank.index': { paramsTuple?: []; params?: {} }
    'swimming_classes.index': { paramsTuple?: []; params?: {} }
    'swimming_classes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swimming_classes.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'lessons.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'landing': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'release.index': { paramsTuple?: []; params?: {} }
    'docs.index': { paramsTuple?: []; params?: {} }
    'sign_in_links.create': { paramsTuple?: []; params?: {} }
    'account_registrations.create': { paramsTuple?: []; params?: {} }
    'auth.verify': { paramsTuple?: []; params?: {} }
    'accounts.edit': { paramsTuple?: []; params?: {} }
    'account_passwords.edit': { paramsTuple?: []; params?: {} }
    'schools.create': { paramsTuple?: []; params?: {} }
    'members.index': { paramsTuple?: []; params?: {} }
    'invitations.create': { paramsTuple?: []; params?: {} }
    'memberships.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'signups.create': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'customer_plans.index': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'customer_purchases.verify': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'customer_plans.show': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue,'programId': ParamValue} }
    'signups.index': { paramsTuple?: []; params?: {} }
    'enrolment.index': { paramsTuple?: []; params?: {} }
    'learners.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programs.index': { paramsTuple?: []; params?: {} }
    'programs.create': { paramsTuple?: []; params?: {} }
    'programs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programs.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'levels.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swim_years.index': { paramsTuple?: []; params?: {} }
    'skill_bank.index': { paramsTuple?: []; params?: {} }
    'bank_packs.index': { paramsTuple?: []; params?: {} }
    'activity_bank.index': { paramsTuple?: []; params?: {} }
    'swimming_classes.index': { paramsTuple?: []; params?: {} }
    'swimming_classes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swimming_classes.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'lessons.index': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'sessions.store': { paramsTuple?: []; params?: {} }
    'sign_in_links.store': { paramsTuple?: []; params?: {} }
    'account_registrations.store': { paramsTuple?: []; params?: {} }
    'sessions.destroy': { paramsTuple?: []; params?: {} }
    'schools.store': { paramsTuple?: []; params?: {} }
    'invitations.store': { paramsTuple?: []; params?: {} }
    'signups.store': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'customer_purchases.store': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'api.accounts.store': { paramsTuple?: []; params?: {} }
    'paystack_webhooks.store': { paramsTuple?: []; params?: {} }
    'enrolment.place': { paramsTuple?: []; params?: {} }
    'enrolment.withdraw': { paramsTuple?: []; params?: {} }
    'programs.store': { paramsTuple?: []; params?: {} }
    'swim_years.store': { paramsTuple?: []; params?: {} }
    'school_age_groups.store': { paramsTuple?: []; params?: {} }
    'skill_bank.store': { paramsTuple?: []; params?: {} }
    'skill_bank_families.store': { paramsTuple?: []; params?: {} }
    'activity_bank.store': { paramsTuple?: []; params?: {} }
    'swimming_classes.store': { paramsTuple?: []; params?: {} }
    'swimming_classes.duplicate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'class_lessons.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'lessons.store': { paramsTuple?: []; params?: {} }
    'class_lessons.copy_activities': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'class_lessons.bulk_assign_instructors': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'accounts.update': { paramsTuple?: []; params?: {} }
    'account_passwords.update': { paramsTuple?: []; params?: {} }
    'active_schools.update': { paramsTuple?: []; params?: {} }
    'signups.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programs.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'level_settings.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swim_years.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'school_age_groups.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'skill_bank.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bank_packs.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'skill_bank_families.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'activity_bank.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'activity_bank_categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swimming_classes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'class_lessons.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'class_lessons.activities_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'class_lessons.assign_instructors': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'programs.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swim_years.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'school_age_groups.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'skill_bank.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bank_packs.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'skill_bank_families.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'activity_bank.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'activity_bank_categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swimming_classes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'programs.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swim_years.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'school_age_groups.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'skill_bank.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'skill_bank_families.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'activity_bank.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'activity_bank_categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'class_lessons.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}