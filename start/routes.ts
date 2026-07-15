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
  .use(middleware.activeSchool())
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
    router.get('schools/create', [controllers.Schools, 'create'])
    router.post('schools', [controllers.Schools, 'store'])
  })
  .use(middleware.auth())
  .use(middleware.completeProfile())

router
  .patch('active-school', [controllers.ActiveSchools, 'update'])
  .use(middleware.auth())
  .use(middleware.completeProfile())
  .use(middleware.activeSchool())

router
  .group(() => {
    router.get('invitations/create', [controllers.Invitations, 'create'])
    router.post('invitations', [controllers.Invitations, 'store'])
  })
  .use(middleware.auth())
  .use(middleware.completeProfile())
  .use(middleware.activeSchool())
  .use(middleware.authorize('invitation.create'))

// Accept an invitation — open link, the token is the authority.
router.get('invitations/:token', [controllers.Memberships, 'store'])

// Public learn-to-swim sign-up — no auth, school resolved by organisation + school slugs.
router
  .group(() => {
    router.get('register/:organisationSlug/:schoolSlug', [controllers.Signups, 'create'])
    router.post('register/:organisationSlug/:schoolSlug', [controllers.Signups, 'store'])
  })
  .where('organisationSlug', router.matchers.slug())
  .where('schoolSlug', router.matchers.slug())

// Admin sign-ups list — active-school scoped, permission-gated.
router
  .get('signups', [controllers.Signups, 'index'])
  .use(middleware.auth())
  .use(middleware.completeProfile())
  .use(middleware.activeSchool())
  .use(middleware.authorize('signup.view'))

// Swim programs — shared catalog (all members view; Admin/Head Coach manage)
// plus each school's per-level fee/availability settings.
router
  .group(() => {
    router
      .resource('programs', controllers.Programs)
      .except(['show'])
      .use(['create', 'store', 'edit', 'update', 'destroy'], middleware.authorize('program.manage'))

    router
      .patch('levels/:id/settings', [controllers.LevelSettings, 'update'])
      .use(middleware.authorize('program.manage'))
  })
  .use(middleware.auth())
  .use(middleware.completeProfile())
  .use(middleware.activeSchool())

// Swimming classes — day-based classes created inline from the programs list.
router
  .group(() => {
    router
      .resource('classes', controllers.SwimmingClasses)
      .except(['destroy', 'create'])
      .as('swimming_classes')
      .where('id', router.matchers.number())
      .use(['index', 'show'], middleware.authorize('class.view'))
      .use(['store', 'edit', 'update'], middleware.authorize('class.manage'))

    router
      .post('classes/:id/lessons', [controllers.ClassLessons, 'store'])
      .as('class_lessons.store')
      .where('id', router.matchers.number())
      .use(middleware.authorize('class.manage'))

    router
      .patch('class-lessons/:id', [controllers.ClassLessons, 'update'])
      .as('class_lessons.update')
      .where('id', router.matchers.number())
      .use(middleware.authorize('class.manage'))

    router
      .delete('class-lessons/:id', [controllers.ClassLessons, 'destroy'])
      .as('class_lessons.destroy')
      .where('id', router.matchers.number())
      .use(middleware.authorize('class.manage'))
  })
  .use(middleware.auth())
  .use(middleware.completeProfile())
  .use(middleware.activeSchool())
