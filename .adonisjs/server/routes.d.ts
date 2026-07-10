import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'sign_in_links.create': { paramsTuple?: []; params?: {} }
    'sign_in_links.store': { paramsTuple?: []; params?: {} }
    'auth.verify': { paramsTuple?: []; params?: {} }
    'accounts.edit': { paramsTuple?: []; params?: {} }
    'accounts.update': { paramsTuple?: []; params?: {} }
    'sessions.destroy': { paramsTuple?: []; params?: {} }
    'schools.create': { paramsTuple?: []; params?: {} }
    'schools.store': { paramsTuple?: []; params?: {} }
    'active_schools.update': { paramsTuple?: []; params?: {} }
    'invitations.create': { paramsTuple?: []; params?: {} }
    'invitations.store': { paramsTuple?: []; params?: {} }
    'memberships.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'signups.create': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'signups.store': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'signups.index': { paramsTuple?: []; params?: {} }
    'programs.index': { paramsTuple?: []; params?: {} }
    'programs.create': { paramsTuple?: []; params?: {} }
    'programs.store': { paramsTuple?: []; params?: {} }
    'programs.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programs.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programs.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'level_settings.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'sign_in_links.create': { paramsTuple?: []; params?: {} }
    'auth.verify': { paramsTuple?: []; params?: {} }
    'accounts.edit': { paramsTuple?: []; params?: {} }
    'schools.create': { paramsTuple?: []; params?: {} }
    'invitations.create': { paramsTuple?: []; params?: {} }
    'memberships.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'signups.create': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'signups.index': { paramsTuple?: []; params?: {} }
    'programs.index': { paramsTuple?: []; params?: {} }
    'programs.create': { paramsTuple?: []; params?: {} }
    'programs.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'sign_in_links.create': { paramsTuple?: []; params?: {} }
    'auth.verify': { paramsTuple?: []; params?: {} }
    'accounts.edit': { paramsTuple?: []; params?: {} }
    'schools.create': { paramsTuple?: []; params?: {} }
    'invitations.create': { paramsTuple?: []; params?: {} }
    'memberships.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'signups.create': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'signups.index': { paramsTuple?: []; params?: {} }
    'programs.index': { paramsTuple?: []; params?: {} }
    'programs.create': { paramsTuple?: []; params?: {} }
    'programs.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'sign_in_links.store': { paramsTuple?: []; params?: {} }
    'sessions.destroy': { paramsTuple?: []; params?: {} }
    'schools.store': { paramsTuple?: []; params?: {} }
    'invitations.store': { paramsTuple?: []; params?: {} }
    'signups.store': { paramsTuple: [ParamValue,ParamValue]; params: {'organisationSlug': ParamValue,'schoolSlug': ParamValue} }
    'programs.store': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'accounts.update': { paramsTuple?: []; params?: {} }
    'active_schools.update': { paramsTuple?: []; params?: {} }
    'programs.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'level_settings.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'programs.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'programs.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}