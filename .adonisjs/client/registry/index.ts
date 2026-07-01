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
