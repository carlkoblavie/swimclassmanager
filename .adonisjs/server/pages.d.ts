import '@adonisjs/inertia/types'

import type React from 'react'
import type { Prettify } from '@adonisjs/core/types/common'

type ExtractProps<T> =
  T extends React.FC<infer Props>
    ? Prettify<Omit<Props, 'children'>>
    : T extends React.Component<infer Props>
      ? Prettify<Omit<Props, 'children'>>
      : never

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'account/change_password': ExtractProps<(typeof import('../../inertia/pages/account/change_password.tsx'))['default']>
    'account/complete_profile': ExtractProps<(typeof import('../../inertia/pages/account/complete_profile.tsx'))['default']>
    'auth/login': ExtractProps<(typeof import('../../inertia/pages/auth/login.tsx'))['default']>
    'auth/signup': ExtractProps<(typeof import('../../inertia/pages/auth/signup.tsx'))['default']>
    'classes/edit': ExtractProps<(typeof import('../../inertia/pages/classes/edit.tsx'))['default']>
    'classes/index': ExtractProps<(typeof import('../../inertia/pages/classes/index.tsx'))['default']>
    'classes/show': ExtractProps<(typeof import('../../inertia/pages/classes/show.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.tsx'))['default']>
    'invitations/create': ExtractProps<(typeof import('../../inertia/pages/invitations/create.tsx'))['default']>
    'landing': ExtractProps<(typeof import('../../inertia/pages/landing.tsx'))['default']>
    'levels/show': ExtractProps<(typeof import('../../inertia/pages/levels/show.tsx'))['default']>
    'programs/create': ExtractProps<(typeof import('../../inertia/pages/programs/create.tsx'))['default']>
    'programs/edit': ExtractProps<(typeof import('../../inertia/pages/programs/edit.tsx'))['default']>
    'programs/index': ExtractProps<(typeof import('../../inertia/pages/programs/index.tsx'))['default']>
    'programs/show': ExtractProps<(typeof import('../../inertia/pages/programs/show.tsx'))['default']>
    'schools/create': ExtractProps<(typeof import('../../inertia/pages/schools/create.tsx'))['default']>
    'settings/swim_years': ExtractProps<(typeof import('../../inertia/pages/settings/swim_years.tsx'))['default']>
    'signups/create': ExtractProps<(typeof import('../../inertia/pages/signups/create.tsx'))['default']>
    'signups/index': ExtractProps<(typeof import('../../inertia/pages/signups/index.tsx'))['default']>
    'banks/activities': ExtractProps<(typeof import('../../inertia/pages/banks/activities.tsx'))['default']>
    'banks/packs': ExtractProps<(typeof import('../../inertia/pages/banks/packs.tsx'))['default']>
    'banks/skills': ExtractProps<(typeof import('../../inertia/pages/banks/skills.tsx'))['default']>
  }
}
