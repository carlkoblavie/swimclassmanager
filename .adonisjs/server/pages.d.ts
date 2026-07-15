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
    'account/complete_profile': ExtractProps<(typeof import('../../inertia/pages/account/complete_profile.tsx'))['default']>
    'auth/login': ExtractProps<(typeof import('../../inertia/pages/auth/login.tsx'))['default']>
    'classes/create': ExtractProps<(typeof import('../../inertia/pages/classes/create.tsx'))['default']>
    'classes/edit': ExtractProps<(typeof import('../../inertia/pages/classes/edit.tsx'))['default']>
    'classes/index': ExtractProps<(typeof import('../../inertia/pages/classes/index.tsx'))['default']>
    'classes/show': ExtractProps<(typeof import('../../inertia/pages/classes/show.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.tsx'))['default']>
    'invitations/create': ExtractProps<(typeof import('../../inertia/pages/invitations/create.tsx'))['default']>
    'programs/create': ExtractProps<(typeof import('../../inertia/pages/programs/create.tsx'))['default']>
    'programs/edit': ExtractProps<(typeof import('../../inertia/pages/programs/edit.tsx'))['default']>
    'programs/index': ExtractProps<(typeof import('../../inertia/pages/programs/index.tsx'))['default']>
    'schools/create': ExtractProps<(typeof import('../../inertia/pages/schools/create.tsx'))['default']>
    'signups/create': ExtractProps<(typeof import('../../inertia/pages/signups/create.tsx'))['default']>
    'signups/index': ExtractProps<(typeof import('../../inertia/pages/signups/index.tsx'))['default']>
  }
}
