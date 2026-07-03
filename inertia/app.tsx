import '@mantine/core/styles.css'
import './css/app.css'
import { type ReactElement } from 'react'
import { client } from './client'
import { theme } from '~/theme'
import Layout from '~/layouts/default'
import { type Data } from '@generated/data'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { createInertiaApp } from '@inertiajs/react'
import { TuyauProvider } from '@adonisjs/inertia/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'

const appName = import.meta.env.VITE_APP_NAME || 'Swim Class Manager'

createInertiaApp({
  title: (title) => (title ? `${title} - ${appName}` : appName),
  resolve: (name) => {
    return resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob('./pages/**/*.tsx'),
      (page: ReactElement<Data.SharedProps>) => <Layout children={page} />
    )
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <MantineProvider theme={theme} defaultColorScheme="light">
        <TuyauProvider client={client}>
          <App {...props} />
        </TuyauProvider>
      </MantineProvider>
    )
  },
  progress: {
    color: '#4B5563',
  },
})
