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
    'clubs.create': { paramsTuple?: []; params?: {} }
    'clubs.store': { paramsTuple?: []; params?: {} }
    'invitations.create': { paramsTuple?: []; params?: {} }
    'invitations.store': { paramsTuple?: []; params?: {} }
    'memberships.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'sign_in_links.create': { paramsTuple?: []; params?: {} }
    'auth.verify': { paramsTuple?: []; params?: {} }
    'accounts.edit': { paramsTuple?: []; params?: {} }
    'clubs.create': { paramsTuple?: []; params?: {} }
    'invitations.create': { paramsTuple?: []; params?: {} }
    'memberships.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'sign_in_links.create': { paramsTuple?: []; params?: {} }
    'auth.verify': { paramsTuple?: []; params?: {} }
    'accounts.edit': { paramsTuple?: []; params?: {} }
    'clubs.create': { paramsTuple?: []; params?: {} }
    'invitations.create': { paramsTuple?: []; params?: {} }
    'memberships.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
  }
  POST: {
    'sign_in_links.store': { paramsTuple?: []; params?: {} }
    'sessions.destroy': { paramsTuple?: []; params?: {} }
    'clubs.store': { paramsTuple?: []; params?: {} }
    'invitations.store': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'accounts.update': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}