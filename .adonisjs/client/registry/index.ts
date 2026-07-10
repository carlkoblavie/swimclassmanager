/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['home']['types'],
  },
  'sign_in_links.create': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['sign_in_links.create']['types'],
  },
  'sign_in_links.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['sign_in_links.store']['types'],
  },
  'auth.verify': {
    methods: ["GET","HEAD"],
    pattern: '/auth/verify',
    tokens: [{"old":"/auth/verify","type":0,"val":"auth","end":""},{"old":"/auth/verify","type":0,"val":"verify","end":""}],
    types: placeholder as Registry['auth.verify']['types'],
  },
  'accounts.edit': {
    methods: ["GET","HEAD"],
    pattern: '/complete-profile',
    tokens: [{"old":"/complete-profile","type":0,"val":"complete-profile","end":""}],
    types: placeholder as Registry['accounts.edit']['types'],
  },
  'accounts.update': {
    methods: ["PATCH"],
    pattern: '/complete-profile',
    tokens: [{"old":"/complete-profile","type":0,"val":"complete-profile","end":""}],
    types: placeholder as Registry['accounts.update']['types'],
  },
  'sessions.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['sessions.destroy']['types'],
  },
  'schools.create': {
    methods: ["GET","HEAD"],
    pattern: '/schools/create',
    tokens: [{"old":"/schools/create","type":0,"val":"schools","end":""},{"old":"/schools/create","type":0,"val":"create","end":""}],
    types: placeholder as Registry['schools.create']['types'],
  },
  'schools.store': {
    methods: ["POST"],
    pattern: '/schools',
    tokens: [{"old":"/schools","type":0,"val":"schools","end":""}],
    types: placeholder as Registry['schools.store']['types'],
  },
  'active_schools.update': {
    methods: ["PATCH"],
    pattern: '/active-school',
    tokens: [{"old":"/active-school","type":0,"val":"active-school","end":""}],
    types: placeholder as Registry['active_schools.update']['types'],
  },
  'invitations.create': {
    methods: ["GET","HEAD"],
    pattern: '/invitations/create',
    tokens: [{"old":"/invitations/create","type":0,"val":"invitations","end":""},{"old":"/invitations/create","type":0,"val":"create","end":""}],
    types: placeholder as Registry['invitations.create']['types'],
  },
  'invitations.store': {
    methods: ["POST"],
    pattern: '/invitations',
    tokens: [{"old":"/invitations","type":0,"val":"invitations","end":""}],
    types: placeholder as Registry['invitations.store']['types'],
  },
  'memberships.store': {
    methods: ["GET","HEAD"],
    pattern: '/invitations/:token',
    tokens: [{"old":"/invitations/:token","type":0,"val":"invitations","end":""},{"old":"/invitations/:token","type":1,"val":"token","end":""}],
    types: placeholder as Registry['memberships.store']['types'],
  },
  'signups.create': {
    methods: ["GET","HEAD"],
    pattern: '/register/:organisationSlug/:schoolSlug',
    tokens: [{"old":"/register/:organisationSlug/:schoolSlug","type":0,"val":"register","end":""},{"old":"/register/:organisationSlug/:schoolSlug","type":1,"val":"organisationSlug","end":""},{"old":"/register/:organisationSlug/:schoolSlug","type":1,"val":"schoolSlug","end":""}],
    types: placeholder as Registry['signups.create']['types'],
  },
  'signups.store': {
    methods: ["POST"],
    pattern: '/register/:organisationSlug/:schoolSlug',
    tokens: [{"old":"/register/:organisationSlug/:schoolSlug","type":0,"val":"register","end":""},{"old":"/register/:organisationSlug/:schoolSlug","type":1,"val":"organisationSlug","end":""},{"old":"/register/:organisationSlug/:schoolSlug","type":1,"val":"schoolSlug","end":""}],
    types: placeholder as Registry['signups.store']['types'],
  },
  'signups.index': {
    methods: ["GET","HEAD"],
    pattern: '/signups',
    tokens: [{"old":"/signups","type":0,"val":"signups","end":""}],
    types: placeholder as Registry['signups.index']['types'],
  },
  'programs.index': {
    methods: ["GET","HEAD"],
    pattern: '/programs',
    tokens: [{"old":"/programs","type":0,"val":"programs","end":""}],
    types: placeholder as Registry['programs.index']['types'],
  },
  'programs.create': {
    methods: ["GET","HEAD"],
    pattern: '/programs/create',
    tokens: [{"old":"/programs/create","type":0,"val":"programs","end":""},{"old":"/programs/create","type":0,"val":"create","end":""}],
    types: placeholder as Registry['programs.create']['types'],
  },
  'programs.store': {
    methods: ["POST"],
    pattern: '/programs',
    tokens: [{"old":"/programs","type":0,"val":"programs","end":""}],
    types: placeholder as Registry['programs.store']['types'],
  },
  'programs.edit': {
    methods: ["GET","HEAD"],
    pattern: '/programs/:id/edit',
    tokens: [{"old":"/programs/:id/edit","type":0,"val":"programs","end":""},{"old":"/programs/:id/edit","type":1,"val":"id","end":""},{"old":"/programs/:id/edit","type":0,"val":"edit","end":""}],
    types: placeholder as Registry['programs.edit']['types'],
  },
  'programs.update': {
    methods: ["PUT","PATCH"],
    pattern: '/programs/:id',
    tokens: [{"old":"/programs/:id","type":0,"val":"programs","end":""},{"old":"/programs/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['programs.update']['types'],
  },
  'programs.destroy': {
    methods: ["DELETE"],
    pattern: '/programs/:id',
    tokens: [{"old":"/programs/:id","type":0,"val":"programs","end":""},{"old":"/programs/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['programs.destroy']['types'],
  },
  'level_settings.update': {
    methods: ["PATCH"],
    pattern: '/levels/:id/settings',
    tokens: [{"old":"/levels/:id/settings","type":0,"val":"levels","end":""},{"old":"/levels/:id/settings","type":1,"val":"id","end":""},{"old":"/levels/:id/settings","type":0,"val":"settings","end":""}],
    types: placeholder as Registry['level_settings.update']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
