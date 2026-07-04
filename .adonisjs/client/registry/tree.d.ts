/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  home: typeof routes['home']
  signInLinks: {
    create: typeof routes['sign_in_links.create']
    store: typeof routes['sign_in_links.store']
  }
  auth: {
    verify: typeof routes['auth.verify']
  }
  accounts: {
    edit: typeof routes['accounts.edit']
    update: typeof routes['accounts.update']
  }
  sessions: {
    destroy: typeof routes['sessions.destroy']
  }
  clubs: {
    create: typeof routes['clubs.create']
    store: typeof routes['clubs.store']
  }
  invitations: {
    create: typeof routes['invitations.create']
    store: typeof routes['invitations.store']
  }
  memberships: {
    store: typeof routes['memberships.store']
  }
  signups: {
    create: typeof routes['signups.create']
    store: typeof routes['signups.store']
    index: typeof routes['signups.index']
  }
  programs: {
    index: typeof routes['programs.index']
    create: typeof routes['programs.create']
    store: typeof routes['programs.store']
    edit: typeof routes['programs.edit']
    update: typeof routes['programs.update']
    destroy: typeof routes['programs.destroy']
  }
  levelSettings: {
    update: typeof routes['level_settings.update']
  }
}
