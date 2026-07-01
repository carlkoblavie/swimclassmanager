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
}
