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
    'signups.create': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'signups.store': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'signups.index': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'sign_in_links.create': { paramsTuple?: []; params?: {} }
    'auth.verify': { paramsTuple?: []; params?: {} }
    'accounts.edit': { paramsTuple?: []; params?: {} }
    'clubs.create': { paramsTuple?: []; params?: {} }
    'invitations.create': { paramsTuple?: []; params?: {} }
    'memberships.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'signups.create': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'signups.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'sign_in_links.create': { paramsTuple?: []; params?: {} }
    'auth.verify': { paramsTuple?: []; params?: {} }
    'accounts.edit': { paramsTuple?: []; params?: {} }
    'clubs.create': { paramsTuple?: []; params?: {} }
    'invitations.create': { paramsTuple?: []; params?: {} }
    'memberships.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'signups.create': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'signups.index': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'sign_in_links.store': { paramsTuple?: []; params?: {} }
    'sessions.destroy': { paramsTuple?: []; params?: {} }
    'clubs.store': { paramsTuple?: []; params?: {} }
    'invitations.store': { paramsTuple?: []; params?: {} }
    'signups.store': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
  }
  PATCH: {
    'accounts.update': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}