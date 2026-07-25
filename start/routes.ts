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
  .get('/', ({ auth, response }) => {
    if (auth.user) {
      return response.redirect().toRoute('home')
    }

    return response.redirect('/signup')
  })
  .as('landing')

router
  .on('/dashboard')
  .renderInertia('home', {})
  .use(middleware.auth())
  .use(middleware.forcePasswordChange())
  .use(middleware.completeProfile())
  .use(middleware.activeSchool())
  .as('home')

router
  .group(() => {
    router.get('login', [controllers.Sessions, 'create']).as('sign_in_links.create')
    router.post('login', [controllers.Sessions, 'store'])
    router.post('login/magic-link', [controllers.SignInLinks, 'store'])
    router.get('signup', [controllers.AccountRegistrations, 'create'])
    router.post('signup', [controllers.AccountRegistrations, 'store'])
    router.get('auth/verify', [controllers.Sessions, 'store']).as('auth.verify')
  })
  .use(middleware.guest())

router
  .group(() => {
    router.get('complete-profile', [controllers.Accounts, 'edit'])
    router.patch('complete-profile', [controllers.Accounts, 'update'])
    router.get('account/password', [controllers.AccountPasswords, 'edit'])
    router.patch('account/password', [controllers.AccountPasswords, 'update'])
    router.post('logout', [controllers.Sessions, 'destroy'])
  })
  .use(middleware.auth())

router
  .group(() => {
    router.get('schools/create', [controllers.Schools, 'create'])
    router.post('schools', [controllers.Schools, 'store'])
  })
  .use(middleware.auth())
  .use(middleware.forcePasswordChange())
  .use(middleware.completeProfile())

router
  .patch('active-school', [controllers.ActiveSchools, 'update'])
  .use(middleware.auth())
  .use(middleware.forcePasswordChange())
  .use(middleware.completeProfile())
  .use(middleware.activeSchool())

router
  .group(() => {
    router.get('invitations/create', [controllers.Invitations, 'create'])
    router.post('invitations', [controllers.Invitations, 'store'])
  })
  .use(middleware.auth())
  .use(middleware.forcePasswordChange())
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

// Public customer purchase API (JSON) — a school's available levels (plans)
// grouped by program, priced with the school's fee, plus the current swim year.
router
  .group(() => {
    router.get('api/register/:organisationSlug/:schoolSlug/plans', [
      controllers.CustomerPlans,
      'index',
    ])
    router
      .get('api/register/:organisationSlug/:schoolSlug/programs/:programId/levels', [
        controllers.CustomerPlans,
        'show',
      ])
      .where('programId', router.matchers.uuid())
  })
  .where('organisationSlug', router.matchers.slug())
  .where('schoolSlug', router.matchers.slug())

// Programmatic account creation (JSON) — public self-serve, same flow as the
// web signup. CSRF-exempt via the /api prefix in config/shield.ts.
router.post('api/accounts', [controllers.AccountRegistrations, 'storeApi']).as('api.accounts.store')

// Admin sign-ups list — active-school scoped, permission-gated.
router
  .get('signups', [controllers.Signups, 'index'])
  .use(middleware.auth())
  .use(middleware.forcePasswordChange())
  .use(middleware.completeProfile())
  .use(middleware.activeSchool())
  .use(middleware.authorize('signup.view'))

// Swim programs — shared catalog (all members view; Admin/Head Coach manage)
// plus each school's per-level fee/availability settings.
router
  .group(() => {
    router
      .resource('programs', controllers.Programs)
      .where('id', router.matchers.number())
      .use(['create', 'store', 'edit', 'update', 'destroy'], middleware.authorize('program.manage'))

    router.get('levels/:id', [controllers.Levels, 'show']).where('id', router.matchers.number())

    router
      .patch('levels/:id/settings', [controllers.LevelSettings, 'update'])
      .use(middleware.authorize('program.manage'))
  })
  .use(middleware.auth())
  .use(middleware.forcePasswordChange())
  .use(middleware.completeProfile())
  .use(middleware.activeSchool())

// School settings — swim years and terms, managed by Admin/Head Coach.
router
  .group(() => {
    router
      .resource('swim-years', controllers.SwimYears)
      .only(['index', 'store', 'update', 'destroy'])
      .where('id', router.matchers.number())
  })
  .prefix('settings')
  .use(middleware.auth())
  .use(middleware.forcePasswordChange())
  .use(middleware.completeProfile())
  .use(middleware.activeSchool())
  .use(middleware.authorize('settings.manage'))

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
  .use(middleware.forcePasswordChange())
  .use(middleware.completeProfile())
  .use(middleware.activeSchool())
