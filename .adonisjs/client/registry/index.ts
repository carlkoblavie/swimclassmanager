/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'landing': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['landing']['types'],
  },
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/dashboard',
    tokens: [{"old":"/dashboard","type":0,"val":"dashboard","end":""}],
    types: placeholder as Registry['home']['types'],
  },
  'sign_in_links.create': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['sign_in_links.create']['types'],
  },
  'sessions.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['sessions.store']['types'],
  },
  'sign_in_links.store': {
    methods: ["POST"],
    pattern: '/login/magic-link',
    tokens: [{"old":"/login/magic-link","type":0,"val":"login","end":""},{"old":"/login/magic-link","type":0,"val":"magic-link","end":""}],
    types: placeholder as Registry['sign_in_links.store']['types'],
  },
  'account_registrations.create': {
    methods: ["GET","HEAD"],
    pattern: '/signup',
    tokens: [{"old":"/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['account_registrations.create']['types'],
  },
  'account_registrations.store': {
    methods: ["POST"],
    pattern: '/signup',
    tokens: [{"old":"/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['account_registrations.store']['types'],
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
  'account_passwords.edit': {
    methods: ["GET","HEAD"],
    pattern: '/account/password',
    tokens: [{"old":"/account/password","type":0,"val":"account","end":""},{"old":"/account/password","type":0,"val":"password","end":""}],
    types: placeholder as Registry['account_passwords.edit']['types'],
  },
  'account_passwords.update': {
    methods: ["PATCH"],
    pattern: '/account/password',
    tokens: [{"old":"/account/password","type":0,"val":"account","end":""},{"old":"/account/password","type":0,"val":"password","end":""}],
    types: placeholder as Registry['account_passwords.update']['types'],
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
  'customer_plans.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/register/:organisationSlug/:schoolSlug/plans',
    tokens: [{"old":"/api/register/:organisationSlug/:schoolSlug/plans","type":0,"val":"api","end":""},{"old":"/api/register/:organisationSlug/:schoolSlug/plans","type":0,"val":"register","end":""},{"old":"/api/register/:organisationSlug/:schoolSlug/plans","type":1,"val":"organisationSlug","end":""},{"old":"/api/register/:organisationSlug/:schoolSlug/plans","type":1,"val":"schoolSlug","end":""},{"old":"/api/register/:organisationSlug/:schoolSlug/plans","type":0,"val":"plans","end":""}],
    types: placeholder as Registry['customer_plans.index']['types'],
  },
  'customer_purchases.store': {
    methods: ["POST"],
    pattern: '/api/register/:organisationSlug/:schoolSlug/purchases',
    tokens: [{"old":"/api/register/:organisationSlug/:schoolSlug/purchases","type":0,"val":"api","end":""},{"old":"/api/register/:organisationSlug/:schoolSlug/purchases","type":0,"val":"register","end":""},{"old":"/api/register/:organisationSlug/:schoolSlug/purchases","type":1,"val":"organisationSlug","end":""},{"old":"/api/register/:organisationSlug/:schoolSlug/purchases","type":1,"val":"schoolSlug","end":""},{"old":"/api/register/:organisationSlug/:schoolSlug/purchases","type":0,"val":"purchases","end":""}],
    types: placeholder as Registry['customer_purchases.store']['types'],
  },
  'customer_purchases.verify': {
    methods: ["GET","HEAD"],
    pattern: '/api/register/:organisationSlug/:schoolSlug/purchases/verify',
    tokens: [{"old":"/api/register/:organisationSlug/:schoolSlug/purchases/verify","type":0,"val":"api","end":""},{"old":"/api/register/:organisationSlug/:schoolSlug/purchases/verify","type":0,"val":"register","end":""},{"old":"/api/register/:organisationSlug/:schoolSlug/purchases/verify","type":1,"val":"organisationSlug","end":""},{"old":"/api/register/:organisationSlug/:schoolSlug/purchases/verify","type":1,"val":"schoolSlug","end":""},{"old":"/api/register/:organisationSlug/:schoolSlug/purchases/verify","type":0,"val":"purchases","end":""},{"old":"/api/register/:organisationSlug/:schoolSlug/purchases/verify","type":0,"val":"verify","end":""}],
    types: placeholder as Registry['customer_purchases.verify']['types'],
  },
  'customer_plans.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/register/:organisationSlug/:schoolSlug/programs/:programId/levels',
    tokens: [{"old":"/api/register/:organisationSlug/:schoolSlug/programs/:programId/levels","type":0,"val":"api","end":""},{"old":"/api/register/:organisationSlug/:schoolSlug/programs/:programId/levels","type":0,"val":"register","end":""},{"old":"/api/register/:organisationSlug/:schoolSlug/programs/:programId/levels","type":1,"val":"organisationSlug","end":""},{"old":"/api/register/:organisationSlug/:schoolSlug/programs/:programId/levels","type":1,"val":"schoolSlug","end":""},{"old":"/api/register/:organisationSlug/:schoolSlug/programs/:programId/levels","type":0,"val":"programs","end":""},{"old":"/api/register/:organisationSlug/:schoolSlug/programs/:programId/levels","type":1,"val":"programId","end":""},{"old":"/api/register/:organisationSlug/:schoolSlug/programs/:programId/levels","type":0,"val":"levels","end":""}],
    types: placeholder as Registry['customer_plans.show']['types'],
  },
  'api.accounts.store': {
    methods: ["POST"],
    pattern: '/api/accounts',
    tokens: [{"old":"/api/accounts","type":0,"val":"api","end":""},{"old":"/api/accounts","type":0,"val":"accounts","end":""}],
    types: placeholder as Registry['api.accounts.store']['types'],
  },
  'paystack_webhooks.store': {
    methods: ["POST"],
    pattern: '/api/paystack/webhook',
    tokens: [{"old":"/api/paystack/webhook","type":0,"val":"api","end":""},{"old":"/api/paystack/webhook","type":0,"val":"paystack","end":""},{"old":"/api/paystack/webhook","type":0,"val":"webhook","end":""}],
    types: placeholder as Registry['paystack_webhooks.store']['types'],
  },
  'signups.index': {
    methods: ["GET","HEAD"],
    pattern: '/signups',
    tokens: [{"old":"/signups","type":0,"val":"signups","end":""}],
    types: placeholder as Registry['signups.index']['types'],
  },
  'signups.update': {
    methods: ["PATCH"],
    pattern: '/signups/:id',
    tokens: [{"old":"/signups/:id","type":0,"val":"signups","end":""},{"old":"/signups/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['signups.update']['types'],
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
  'programs.show': {
    methods: ["GET","HEAD"],
    pattern: '/programs/:id',
    tokens: [{"old":"/programs/:id","type":0,"val":"programs","end":""},{"old":"/programs/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['programs.show']['types'],
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
  'levels.show': {
    methods: ["GET","HEAD"],
    pattern: '/levels/:id',
    tokens: [{"old":"/levels/:id","type":0,"val":"levels","end":""},{"old":"/levels/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['levels.show']['types'],
  },
  'level_settings.update': {
    methods: ["PATCH"],
    pattern: '/levels/:id/settings',
    tokens: [{"old":"/levels/:id/settings","type":0,"val":"levels","end":""},{"old":"/levels/:id/settings","type":1,"val":"id","end":""},{"old":"/levels/:id/settings","type":0,"val":"settings","end":""}],
    types: placeholder as Registry['level_settings.update']['types'],
  },
  'swim_years.index': {
    methods: ["GET","HEAD"],
    pattern: '/settings/swim-years',
    tokens: [{"old":"/settings/swim-years","type":0,"val":"settings","end":""},{"old":"/settings/swim-years","type":0,"val":"swim-years","end":""}],
    types: placeholder as Registry['swim_years.index']['types'],
  },
  'swim_years.store': {
    methods: ["POST"],
    pattern: '/settings/swim-years',
    tokens: [{"old":"/settings/swim-years","type":0,"val":"settings","end":""},{"old":"/settings/swim-years","type":0,"val":"swim-years","end":""}],
    types: placeholder as Registry['swim_years.store']['types'],
  },
  'swim_years.update': {
    methods: ["PUT","PATCH"],
    pattern: '/settings/swim-years/:id',
    tokens: [{"old":"/settings/swim-years/:id","type":0,"val":"settings","end":""},{"old":"/settings/swim-years/:id","type":0,"val":"swim-years","end":""},{"old":"/settings/swim-years/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['swim_years.update']['types'],
  },
  'swim_years.destroy': {
    methods: ["DELETE"],
    pattern: '/settings/swim-years/:id',
    tokens: [{"old":"/settings/swim-years/:id","type":0,"val":"settings","end":""},{"old":"/settings/swim-years/:id","type":0,"val":"swim-years","end":""},{"old":"/settings/swim-years/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['swim_years.destroy']['types'],
  },
  'school_age_groups.store': {
    methods: ["POST"],
    pattern: '/settings/age-groups',
    tokens: [{"old":"/settings/age-groups","type":0,"val":"settings","end":""},{"old":"/settings/age-groups","type":0,"val":"age-groups","end":""}],
    types: placeholder as Registry['school_age_groups.store']['types'],
  },
  'school_age_groups.update': {
    methods: ["PUT","PATCH"],
    pattern: '/settings/age-groups/:id',
    tokens: [{"old":"/settings/age-groups/:id","type":0,"val":"settings","end":""},{"old":"/settings/age-groups/:id","type":0,"val":"age-groups","end":""},{"old":"/settings/age-groups/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['school_age_groups.update']['types'],
  },
  'school_age_groups.destroy': {
    methods: ["DELETE"],
    pattern: '/settings/age-groups/:id',
    tokens: [{"old":"/settings/age-groups/:id","type":0,"val":"settings","end":""},{"old":"/settings/age-groups/:id","type":0,"val":"age-groups","end":""},{"old":"/settings/age-groups/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['school_age_groups.destroy']['types'],
  },
  'skill_bank.index': {
    methods: ["GET","HEAD"],
    pattern: '/skill-bank',
    tokens: [{"old":"/skill-bank","type":0,"val":"skill-bank","end":""}],
    types: placeholder as Registry['skill_bank.index']['types'],
  },
  'skill_bank.store': {
    methods: ["POST"],
    pattern: '/skill-bank',
    tokens: [{"old":"/skill-bank","type":0,"val":"skill-bank","end":""}],
    types: placeholder as Registry['skill_bank.store']['types'],
  },
  'skill_bank.update': {
    methods: ["PUT","PATCH"],
    pattern: '/skill-bank/:id',
    tokens: [{"old":"/skill-bank/:id","type":0,"val":"skill-bank","end":""},{"old":"/skill-bank/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['skill_bank.update']['types'],
  },
  'skill_bank.destroy': {
    methods: ["DELETE"],
    pattern: '/skill-bank/:id',
    tokens: [{"old":"/skill-bank/:id","type":0,"val":"skill-bank","end":""},{"old":"/skill-bank/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['skill_bank.destroy']['types'],
  },
  'bank_packs.index': {
    methods: ["GET","HEAD"],
    pattern: '/bank-packs',
    tokens: [{"old":"/bank-packs","type":0,"val":"bank-packs","end":""}],
    types: placeholder as Registry['bank_packs.index']['types'],
  },
  'bank_packs.update': {
    methods: ["PUT","PATCH"],
    pattern: '/bank-packs/:id',
    tokens: [{"old":"/bank-packs/:id","type":0,"val":"bank-packs","end":""},{"old":"/bank-packs/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['bank_packs.update']['types'],
  },
  'skill_bank_families.store': {
    methods: ["POST"],
    pattern: '/skill-bank-families',
    tokens: [{"old":"/skill-bank-families","type":0,"val":"skill-bank-families","end":""}],
    types: placeholder as Registry['skill_bank_families.store']['types'],
  },
  'skill_bank_families.update': {
    methods: ["PUT","PATCH"],
    pattern: '/skill-bank-families/:id',
    tokens: [{"old":"/skill-bank-families/:id","type":0,"val":"skill-bank-families","end":""},{"old":"/skill-bank-families/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['skill_bank_families.update']['types'],
  },
  'skill_bank_families.destroy': {
    methods: ["DELETE"],
    pattern: '/skill-bank-families/:id',
    tokens: [{"old":"/skill-bank-families/:id","type":0,"val":"skill-bank-families","end":""},{"old":"/skill-bank-families/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['skill_bank_families.destroy']['types'],
  },
  'activity_bank.index': {
    methods: ["GET","HEAD"],
    pattern: '/activity-bank',
    tokens: [{"old":"/activity-bank","type":0,"val":"activity-bank","end":""}],
    types: placeholder as Registry['activity_bank.index']['types'],
  },
  'activity_bank.store': {
    methods: ["POST"],
    pattern: '/activity-bank',
    tokens: [{"old":"/activity-bank","type":0,"val":"activity-bank","end":""}],
    types: placeholder as Registry['activity_bank.store']['types'],
  },
  'activity_bank.update': {
    methods: ["PUT","PATCH"],
    pattern: '/activity-bank/:id',
    tokens: [{"old":"/activity-bank/:id","type":0,"val":"activity-bank","end":""},{"old":"/activity-bank/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['activity_bank.update']['types'],
  },
  'activity_bank.destroy': {
    methods: ["DELETE"],
    pattern: '/activity-bank/:id',
    tokens: [{"old":"/activity-bank/:id","type":0,"val":"activity-bank","end":""},{"old":"/activity-bank/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['activity_bank.destroy']['types'],
  },
  'activity_bank_categories.update': {
    methods: ["PUT","PATCH"],
    pattern: '/activity-bank-categories/:id',
    tokens: [{"old":"/activity-bank-categories/:id","type":0,"val":"activity-bank-categories","end":""},{"old":"/activity-bank-categories/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['activity_bank_categories.update']['types'],
  },
  'activity_bank_categories.destroy': {
    methods: ["DELETE"],
    pattern: '/activity-bank-categories/:id',
    tokens: [{"old":"/activity-bank-categories/:id","type":0,"val":"activity-bank-categories","end":""},{"old":"/activity-bank-categories/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['activity_bank_categories.destroy']['types'],
  },
  'swimming_classes.index': {
    methods: ["GET","HEAD"],
    pattern: '/classes',
    tokens: [{"old":"/classes","type":0,"val":"classes","end":""}],
    types: placeholder as Registry['swimming_classes.index']['types'],
  },
  'swimming_classes.store': {
    methods: ["POST"],
    pattern: '/classes',
    tokens: [{"old":"/classes","type":0,"val":"classes","end":""}],
    types: placeholder as Registry['swimming_classes.store']['types'],
  },
  'swimming_classes.show': {
    methods: ["GET","HEAD"],
    pattern: '/classes/:id',
    tokens: [{"old":"/classes/:id","type":0,"val":"classes","end":""},{"old":"/classes/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['swimming_classes.show']['types'],
  },
  'swimming_classes.edit': {
    methods: ["GET","HEAD"],
    pattern: '/classes/:id/edit',
    tokens: [{"old":"/classes/:id/edit","type":0,"val":"classes","end":""},{"old":"/classes/:id/edit","type":1,"val":"id","end":""},{"old":"/classes/:id/edit","type":0,"val":"edit","end":""}],
    types: placeholder as Registry['swimming_classes.edit']['types'],
  },
  'swimming_classes.update': {
    methods: ["PUT","PATCH"],
    pattern: '/classes/:id',
    tokens: [{"old":"/classes/:id","type":0,"val":"classes","end":""},{"old":"/classes/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['swimming_classes.update']['types'],
  },
  'class_lessons.store': {
    methods: ["POST"],
    pattern: '/classes/:id/lessons',
    tokens: [{"old":"/classes/:id/lessons","type":0,"val":"classes","end":""},{"old":"/classes/:id/lessons","type":1,"val":"id","end":""},{"old":"/classes/:id/lessons","type":0,"val":"lessons","end":""}],
    types: placeholder as Registry['class_lessons.store']['types'],
  },
  'class_lessons.update': {
    methods: ["PATCH"],
    pattern: '/class-lessons/:id',
    tokens: [{"old":"/class-lessons/:id","type":0,"val":"class-lessons","end":""},{"old":"/class-lessons/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['class_lessons.update']['types'],
  },
  'class_lessons.destroy': {
    methods: ["DELETE"],
    pattern: '/class-lessons/:id',
    tokens: [{"old":"/class-lessons/:id","type":0,"val":"class-lessons","end":""},{"old":"/class-lessons/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['class_lessons.destroy']['types'],
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
