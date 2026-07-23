import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'landing': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
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
    'invitations.create': { paramsTuple?: []; params?: {} }
    'invitations.store': { paramsTuple?: []; params?: {} }
    'memberships.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'signups.create': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'signups.store': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'customer_plans.index': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'customer_plans.show': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue,'programId': ParamValue} }
    'api.accounts.store': { paramsTuple?: []; params?: {} }
    'signups.index': { paramsTuple?: []; params?: {} }
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
    'swimming_classes.index': { paramsTuple?: []; params?: {} }
    'swimming_classes.store': { paramsTuple?: []; params?: {} }
    'swimming_classes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swimming_classes.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swimming_classes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'class_lessons.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'class_lessons.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'class_lessons.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'landing': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'sign_in_links.create': { paramsTuple?: []; params?: {} }
    'account_registrations.create': { paramsTuple?: []; params?: {} }
    'auth.verify': { paramsTuple?: []; params?: {} }
    'accounts.edit': { paramsTuple?: []; params?: {} }
    'account_passwords.edit': { paramsTuple?: []; params?: {} }
    'schools.create': { paramsTuple?: []; params?: {} }
    'invitations.create': { paramsTuple?: []; params?: {} }
    'memberships.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'signups.create': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'customer_plans.index': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'customer_plans.show': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue,'programId': ParamValue} }
    'signups.index': { paramsTuple?: []; params?: {} }
    'programs.index': { paramsTuple?: []; params?: {} }
    'programs.create': { paramsTuple?: []; params?: {} }
    'programs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programs.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'levels.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swim_years.index': { paramsTuple?: []; params?: {} }
    'swimming_classes.index': { paramsTuple?: []; params?: {} }
    'swimming_classes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swimming_classes.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'landing': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'sign_in_links.create': { paramsTuple?: []; params?: {} }
    'account_registrations.create': { paramsTuple?: []; params?: {} }
    'auth.verify': { paramsTuple?: []; params?: {} }
    'accounts.edit': { paramsTuple?: []; params?: {} }
    'account_passwords.edit': { paramsTuple?: []; params?: {} }
    'schools.create': { paramsTuple?: []; params?: {} }
    'invitations.create': { paramsTuple?: []; params?: {} }
    'memberships.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'signups.create': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'customer_plans.index': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'customer_plans.show': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue,'programId': ParamValue} }
    'signups.index': { paramsTuple?: []; params?: {} }
    'programs.index': { paramsTuple?: []; params?: {} }
    'programs.create': { paramsTuple?: []; params?: {} }
    'programs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programs.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'levels.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swim_years.index': { paramsTuple?: []; params?: {} }
    'swimming_classes.index': { paramsTuple?: []; params?: {} }
    'swimming_classes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swimming_classes.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'sessions.store': { paramsTuple?: []; params?: {} }
    'sign_in_links.store': { paramsTuple?: []; params?: {} }
    'account_registrations.store': { paramsTuple?: []; params?: {} }
    'sessions.destroy': { paramsTuple?: []; params?: {} }
    'schools.store': { paramsTuple?: []; params?: {} }
    'invitations.store': { paramsTuple?: []; params?: {} }
    'signups.store': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'api.accounts.store': { paramsTuple?: []; params?: {} }
    'programs.store': { paramsTuple?: []; params?: {} }
    'swim_years.store': { paramsTuple?: []; params?: {} }
    'swimming_classes.store': { paramsTuple?: []; params?: {} }
    'class_lessons.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'accounts.update': { paramsTuple?: []; params?: {} }
    'account_passwords.update': { paramsTuple?: []; params?: {} }
    'active_schools.update': { paramsTuple?: []; params?: {} }
    'programs.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'level_settings.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swim_years.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swimming_classes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'class_lessons.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'programs.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swim_years.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swimming_classes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'programs.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'swim_years.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'class_lessons.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}