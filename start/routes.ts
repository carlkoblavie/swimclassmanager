/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'

router
  .on('/')
  .renderInertia('home', {})
  .use(middleware.auth())
  .use(middleware.completeProfile())
  .use(middleware.activeClub())
  .as('home')

router
  .group(() => {
    router.get('login', [controllers.SignInLinks, 'create'])
    router.post('login', [controllers.SignInLinks, 'store'])
    router.get('auth/verify', [controllers.Sessions, 'store']).as('auth.verify')
  })
  .use(middleware.guest())

router
  .group(() => {
    router.get('complete-profile', [controllers.Accounts, 'edit'])
    router.patch('complete-profile', [controllers.Accounts, 'update'])
    router.post('logout', [controllers.Sessions, 'destroy'])
  })
  .use(middleware.auth())

router
  .group(() => {
    router.get('clubs/create', [controllers.Clubs, 'create'])
    router.post('clubs', [controllers.Clubs, 'store'])
  })
  .use(middleware.auth())
  .use(middleware.completeProfile())
