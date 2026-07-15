/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'home': {
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
  'sign_in_links.create': {
    methods: ["GET","HEAD"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sign_in_links_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sign_in_links_controller').default['create']>>>
    }
  }
  'sign_in_links.store': {
    methods: ["POST"]
    pattern: '/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/sign_in_link').storeSignInLinkValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/sign_in_link').storeSignInLinkValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sign_in_links_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sign_in_links_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.verify': {
    methods: ["GET","HEAD"]
    pattern: '/auth/verify'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sessions_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sessions_controller').default['store']>>>
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
  'swimming_classes.create': {
    methods: ["GET","HEAD"]
    pattern: '/classes/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/swimming_classes_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/swimming_classes_controller').default['create']>>>
    }
  }
  'swimming_classes.store': {
    methods: ["POST"]
    pattern: '/classes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/swimming_class').storeSwimmingClassValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/swimming_class').storeSwimmingClassValidator)>>
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
  'swimming_class_sessions.update': {
    methods: ["PATCH"]
    pattern: '/class-sessions/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/swimming_class_sessions_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/swimming_class_sessions_controller').default['update']>>>
    }
  }
}
