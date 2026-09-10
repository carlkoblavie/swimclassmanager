/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'landing': {
    methods: ["GET","HEAD"]
    pattern: '/'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'home': {
    methods: ["GET","HEAD"]
    pattern: '/dashboard'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/home_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/home_controller').default['index']>>>
    }
  }
  'release.index': {
    methods: ["GET","HEAD"]
    pattern: '/release'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/release_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/release_controller').default['index']>>>
    }
  }
  'docs.index': {
    methods: ["GET","HEAD"]
    pattern: '/docs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/docs_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/docs_controller').default['index']>>>
    }
  }
  'sign_in_links.create': {
    methods: ["GET","HEAD"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sessions_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sessions_controller').default['create']>>>
    }
  }
  'sessions.store': {
    methods: ["POST"]
    pattern: '/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/sign_in_link').storeSessionValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/sign_in_link').storeSessionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sessions_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sessions_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'sign_in_links.store': {
    methods: ["POST"]
    pattern: '/login/magic-link'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/sign_in_link').storeSignInLinkValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/sign_in_link').storeSignInLinkValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sign_in_links_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sign_in_links_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'account_registrations.create': {
    methods: ["GET","HEAD"]
    pattern: '/signup'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_registrations_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_registrations_controller').default['create']>>>
    }
  }
  'account_registrations.store': {
    methods: ["POST"]
    pattern: '/signup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/account_registration').storeAccountRegistrationValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/account_registration').storeAccountRegistrationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_registrations_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_registrations_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.verify': {
    methods: ["GET","HEAD"]
    pattern: '/auth/verify'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/sign_in_link').storeSessionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sessions_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sessions_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'accounts.edit': {
    methods: ["GET","HEAD"]
    pattern: '/complete-profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/accounts_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/accounts_controller').default['edit']>>>
    }
  }
  'accounts.update': {
    methods: ["PATCH"]
    pattern: '/complete-profile'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/account').updateAccountValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/account').updateAccountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/accounts_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/accounts_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'account_passwords.edit': {
    methods: ["GET","HEAD"]
    pattern: '/account/password'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_passwords_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_passwords_controller').default['edit']>>>
    }
  }
  'account_passwords.update': {
    methods: ["PATCH"]
    pattern: '/account/password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/sign_in_link').updatePasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/sign_in_link').updatePasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_passwords_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_passwords_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'sessions.destroy': {
    methods: ["POST"]
    pattern: '/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sessions_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sessions_controller').default['destroy']>>>
    }
  }
  'schools.create': {
    methods: ["GET","HEAD"]
    pattern: '/schools/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schools_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schools_controller').default['create']>>>
    }
  }
  'schools.store': {
    methods: ["POST"]
    pattern: '/schools'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/school').storeSchoolValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/school').storeSchoolValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schools_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schools_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'active_schools.update': {
    methods: ["PATCH"]
    pattern: '/active-school'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/active_school').updateActiveSchoolValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/active_school').updateActiveSchoolValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/active_schools_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/active_schools_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'members.index': {
    methods: ["GET","HEAD"]
    pattern: '/members'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/members_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/members_controller').default['index']>>>
    }
  }
  'invitations.create': {
    methods: ["GET","HEAD"]
    pattern: '/invitations/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invitations_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invitations_controller').default['create']>>>
    }
  }
  'invitations.store': {
    methods: ["POST"]
    pattern: '/invitations'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/invitation').storeInvitationValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/invitation').storeInvitationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invitations_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invitations_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'memberships.store': {
    methods: ["GET","HEAD"]
    pattern: '/invitations/:token'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/memberships_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/memberships_controller').default['store']>>>
    }
  }
  'signups.create': {
    methods: ["GET","HEAD"]
    pattern: '/register/:organisationSlug/:schoolSlug'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { organisationSlug: ParamValue; schoolSlug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/signups_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/signups_controller').default['create']>>>
    }
  }
  'signups.store': {
    methods: ["POST"]
    pattern: '/register/:organisationSlug/:schoolSlug'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/signup').storeSignupValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { organisationSlug: ParamValue; schoolSlug: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/signup').storeSignupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/signups_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/signups_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customer_plans.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/register/:organisationSlug/:schoolSlug/plans'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { organisationSlug: ParamValue; schoolSlug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer_plans_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer_plans_controller').default['index']>>>
    }
  }
  'customer_purchases.store': {
    methods: ["POST"]
    pattern: '/api/register/:organisationSlug/:schoolSlug/purchases'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customer_purchase').initializeCustomerPurchaseValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { organisationSlug: ParamValue; schoolSlug: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/customer_purchase').initializeCustomerPurchaseValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer_purchases_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer_purchases_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customer_purchases.verify': {
    methods: ["GET","HEAD"]
    pattern: '/api/register/:organisationSlug/:schoolSlug/purchases/verify'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { organisationSlug: ParamValue; schoolSlug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer_purchases_controller').default['verify']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer_purchases_controller').default['verify']>>>
    }
  }
  'customer_plans.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/register/:organisationSlug/:schoolSlug/programs/:programId/levels'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue, ParamValue]
      params: { organisationSlug: ParamValue; schoolSlug: ParamValue; programId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer_plans_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer_plans_controller').default['show']>>>
    }
  }
  'api.accounts.store': {
    methods: ["POST"]
    pattern: '/api/accounts'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/account_registration').storeApiAccountValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/account_registration').storeApiAccountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_registrations_controller').default['storeApi']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_registrations_controller').default['storeApi']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'paystack_webhooks.store': {
    methods: ["POST"]
    pattern: '/api/paystack/webhook'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/paystack_webhooks_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/paystack_webhooks_controller').default['store']>>>
    }
  }
  'signups.index': {
    methods: ["GET","HEAD"]
    pattern: '/signups'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/signups_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/signups_controller').default['index']>>>
    }
  }
  'signups.update': {
    methods: ["PATCH"]
    pattern: '/signups/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/signup').recordPartPaymentValidator)>|InferInput<(typeof import('#validators/signup').updateSignupValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/signup').recordPartPaymentValidator)>|InferInput<(typeof import('#validators/signup').updateSignupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/signups_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/signups_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'enrolment.index': {
    methods: ["GET","HEAD"]
    pattern: '/enrolment'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/enrolments_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/enrolments_controller').default['index']>>>
    }
  }
  'learners.show': {
    methods: ["GET","HEAD"]
    pattern: '/learners/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/learners_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/learners_controller').default['show']>>>
    }
  }
  'enrolment.place': {
    methods: ["POST"]
    pattern: '/enrolment/place'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/enrolment').placeLearnersValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/enrolment').placeLearnersValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/enrolments_controller').default['place']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/enrolments_controller').default['place']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'enrolment.withdraw': {
    methods: ["POST"]
    pattern: '/enrolment/withdraw'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/enrolment').withdrawLearnerValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/enrolment').withdrawLearnerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/enrolments_controller').default['withdraw']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/enrolments_controller').default['withdraw']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'enrolment.assign_stages': {
    methods: ["POST"]
    pattern: '/enrolment/stages'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/enrolment').assignStagesValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/enrolment').assignStagesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/enrolments_controller').default['assignStages']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/enrolments_controller').default['assignStages']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'enrolment.remove_stages': {
    methods: ["POST"]
    pattern: '/enrolment/stages/remove'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/enrolment').clearStagesValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/enrolment').clearStagesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/enrolments_controller').default['removeStages']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/enrolments_controller').default['removeStages']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'enrolment.advance_stage': {
    methods: ["POST"]
    pattern: '/enrolment/advance'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/enrolment').advanceStageValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/enrolment').advanceStageValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/enrolments_controller').default['advanceStage']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/enrolments_controller').default['advanceStage']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'programs.index': {
    methods: ["GET","HEAD"]
    pattern: '/programs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/programs_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/programs_controller').default['index']>>>
    }
  }
  'programs.create': {
    methods: ["GET","HEAD"]
    pattern: '/programs/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/programs_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/programs_controller').default['create']>>>
    }
  }
  'programs.store': {
    methods: ["POST"]
    pattern: '/programs'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/program').storeProgramValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/program').storeProgramValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/programs_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/programs_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'programs.show': {
    methods: ["GET","HEAD"]
    pattern: '/programs/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/programs_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/programs_controller').default['show']>>>
    }
  }
  'programs.edit': {
    methods: ["GET","HEAD"]
    pattern: '/programs/:id/edit'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/programs_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/programs_controller').default['edit']>>>
    }
  }
  'programs.update': {
    methods: ["PUT","PATCH"]
    pattern: '/programs/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/program').updateProgramValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/program').updateProgramValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/programs_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/programs_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'programs.destroy': {
    methods: ["DELETE"]
    pattern: '/programs/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/programs_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/programs_controller').default['destroy']>>>
    }
  }
  'levels.show': {
    methods: ["GET","HEAD"]
    pattern: '/levels/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/levels_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/levels_controller').default['show']>>>
    }
  }
  'level_settings.update': {
    methods: ["PATCH"]
    pattern: '/levels/:id/settings'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/level_setting').updateLevelSettingsValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/level_setting').updateLevelSettingsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/level_settings_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/level_settings_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'swim_years.index': {
    methods: ["GET","HEAD"]
    pattern: '/settings/swim-years'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/swim_years_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/swim_years_controller').default['index']>>>
    }
  }
  'swim_years.store': {
    methods: ["POST"]
    pattern: '/settings/swim-years'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/swim_year').storeSwimYearValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/swim_year').storeSwimYearValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/swim_years_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/swim_years_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'swim_years.update': {
    methods: ["PUT","PATCH"]
    pattern: '/settings/swim-years/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/swim_year').updateSwimYearValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/swim_year').updateSwimYearValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/swim_years_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/swim_years_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'swim_years.destroy': {
    methods: ["DELETE"]
    pattern: '/settings/swim-years/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/swim_years_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/swim_years_controller').default['destroy']>>>
    }
  }
  'school_age_groups.store': {
    methods: ["POST"]
    pattern: '/settings/age-groups'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/bank').storeSchoolAgeGroupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/bank').storeSchoolAgeGroupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/school_age_groups_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/school_age_groups_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'school_age_groups.update': {
    methods: ["PUT","PATCH"]
    pattern: '/settings/age-groups/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/bank').updateSchoolAgeGroupValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/bank').updateSchoolAgeGroupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/school_age_groups_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/school_age_groups_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'school_age_groups.destroy': {
    methods: ["DELETE"]
    pattern: '/settings/age-groups/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/school_age_groups_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/school_age_groups_controller').default['destroy']>>>
    }
  }
  'skill_bank.index': {
    methods: ["GET","HEAD"]
    pattern: '/skill-bank'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/skill_bank_skills_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/skill_bank_skills_controller').default['index']>>>
    }
  }
  'skill_bank.store': {
    methods: ["POST"]
    pattern: '/skill-bank'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/bank').storeSkillBankSkillValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/bank').storeSkillBankSkillValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/skill_bank_skills_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/skill_bank_skills_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'skill_bank.update': {
    methods: ["PUT","PATCH"]
    pattern: '/skill-bank/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/bank').updateSkillBankSkillValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/bank').updateSkillBankSkillValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/skill_bank_skills_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/skill_bank_skills_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'skill_bank.destroy': {
    methods: ["DELETE"]
    pattern: '/skill-bank/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/skill_bank_skills_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/skill_bank_skills_controller').default['destroy']>>>
    }
  }
  'bank_packs.index': {
    methods: ["GET","HEAD"]
    pattern: '/bank-packs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/bank_packs_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/bank_packs_controller').default['index']>>>
    }
  }
  'bank_packs.update': {
    methods: ["PUT","PATCH"]
    pattern: '/bank-packs/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/bank_packs_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/bank_packs_controller').default['update']>>>
    }
  }
  'skill_bank_families.store': {
    methods: ["POST"]
    pattern: '/skill-bank-families'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/bank').storeSkillBankFamilyValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/bank').storeSkillBankFamilyValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/skill_bank_families_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/skill_bank_families_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'skill_bank_families.update': {
    methods: ["PUT","PATCH"]
    pattern: '/skill-bank-families/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/bank').updateSkillBankFamilyValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/bank').updateSkillBankFamilyValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/skill_bank_families_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/skill_bank_families_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'skill_bank_families.destroy': {
    methods: ["DELETE"]
    pattern: '/skill-bank-families/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/skill_bank_families_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/skill_bank_families_controller').default['destroy']>>>
    }
  }
  'activity_bank.index': {
    methods: ["GET","HEAD"]
    pattern: '/activity-bank'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/activity_bank_activities_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/activity_bank_activities_controller').default['index']>>>
    }
  }
  'activity_bank.store': {
    methods: ["POST"]
    pattern: '/activity-bank'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/bank').storeSchoolActivityValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/bank').storeSchoolActivityValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/activity_bank_activities_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/activity_bank_activities_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'activity_bank.update': {
    methods: ["PUT","PATCH"]
    pattern: '/activity-bank/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/bank').updateSchoolActivityValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/bank').updateSchoolActivityValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/activity_bank_activities_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/activity_bank_activities_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'activity_bank.destroy': {
    methods: ["DELETE"]
    pattern: '/activity-bank/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/activity_bank_activities_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/activity_bank_activities_controller').default['destroy']>>>
    }
  }
  'activity_bank_categories.update': {
    methods: ["PUT","PATCH"]
    pattern: '/activity-bank-categories/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/bank').updateSchoolActivityCategoryValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/bank').updateSchoolActivityCategoryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/activity_bank_categories_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/activity_bank_categories_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'activity_bank_categories.destroy': {
    methods: ["DELETE"]
    pattern: '/activity-bank-categories/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/activity_bank_categories_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/activity_bank_categories_controller').default['destroy']>>>
    }
  }
  'swimming_classes.index': {
    methods: ["GET","HEAD"]
    pattern: '/classes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/swimming_classes_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/swimming_classes_controller').default['index']>>>
    }
  }
  'swimming_classes.store': {
    methods: ["POST"]
    pattern: '/classes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/swimming_class').storeSwimmingClassesValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/swimming_class').storeSwimmingClassesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/swimming_classes_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/swimming_classes_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'swimming_classes.show': {
    methods: ["GET","HEAD"]
    pattern: '/classes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/swimming_classes_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/swimming_classes_controller').default['show']>>>
    }
  }
  'swimming_classes.edit': {
    methods: ["GET","HEAD"]
    pattern: '/classes/:id/edit'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/swimming_classes_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/swimming_classes_controller').default['edit']>>>
    }
  }
  'swimming_classes.update': {
    methods: ["PUT","PATCH"]
    pattern: '/classes/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/swimming_class').updateSwimmingClassValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/swimming_class').updateSwimmingClassValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/swimming_classes_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/swimming_classes_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'swimming_classes.duplicate': {
    methods: ["POST"]
    pattern: '/classes/:id/duplicate'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/swimming_classes_controller').default['duplicate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/swimming_classes_controller').default['duplicate']>>>
    }
  }
  'class_lessons.store': {
    methods: ["POST"]
    pattern: '/classes/:id/lessons'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/swimming_class').storeClassLessonValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/swimming_class').storeClassLessonValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/class_lessons_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/class_lessons_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'lessons.index': {
    methods: ["GET","HEAD"]
    pattern: '/lessons'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/lesson_schedules_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/lesson_schedules_controller').default['index']>>>
    }
  }
  'lessons.store': {
    methods: ["POST"]
    pattern: '/lessons'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/swimming_class').generateClassLessonsValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/swimming_class').generateClassLessonsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/lesson_schedules_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/lesson_schedules_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'class_lessons.update': {
    methods: ["PATCH"]
    pattern: '/class-lessons/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/swimming_class').storeClassLessonValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/swimming_class').storeClassLessonValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/class_lessons_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/class_lessons_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'class_lessons.activities_update': {
    methods: ["PATCH"]
    pattern: '/class-lessons/:id/activities'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/swimming_class').updateLessonActivitiesValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/swimming_class').updateLessonActivitiesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/class_lessons_controller').default['updateActivities']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/class_lessons_controller').default['updateActivities']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'class_lessons.copy_activities': {
    methods: ["POST"]
    pattern: '/class-lessons/:id/copy-activities'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/swimming_class').copyLessonActivitiesValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/swimming_class').copyLessonActivitiesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/class_lessons_controller').default['copyActivities']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/class_lessons_controller').default['copyActivities']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'class_lessons.update_plan': {
    methods: ["PATCH"]
    pattern: '/class-lessons/:id/plan'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/swimming_class').updateLessonPlanValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/swimming_class').updateLessonPlanValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/class_lessons_controller').default['updatePlan']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/class_lessons_controller').default['updatePlan']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'stages.assign_instructors': {
    methods: ["PATCH"]
    pattern: '/stages/instructors'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/swimming_class').assignStageInstructorsValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/swimming_class').assignStageInstructorsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/stage_instructors_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/stage_instructors_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'class_lessons.destroy': {
    methods: ["DELETE"]
    pattern: '/class-lessons/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/class_lessons_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/class_lessons_controller').default['destroy']>>>
    }
  }
  'attendance.show': {
    methods: ["GET","HEAD"]
    pattern: '/class-lessons/:id/attendance'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/attendance_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/attendance_controller').default['show']>>>
    }
  }
  'attendance.save': {
    methods: ["POST"]
    pattern: '/class-lessons/:id/attendance'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/attendance').saveAttendanceValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/attendance').saveAttendanceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/attendance_controller').default['save']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/attendance_controller').default['save']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
}
