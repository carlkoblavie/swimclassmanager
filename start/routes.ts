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
  .get('/dashboard', [controllers.Home, 'index'])
  .use(middleware.auth())
  .use(middleware.forcePasswordChange())
  .use(middleware.completeProfile())
  .use(middleware.activeSchool())
  .as('home')

router
  .get('/release', [controllers.Release, 'index'])
  .use(middleware.auth())
  .use(middleware.forcePasswordChange())
  .use(middleware.completeProfile())
  .use(middleware.activeSchool())
  .as('release.index')

router
  .get('/docs', [controllers.Docs, 'index'])
  .use(middleware.auth())
  .use(middleware.forcePasswordChange())
  .use(middleware.completeProfile())
  .use(middleware.activeSchool())
  .as('docs.index')

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
    router.get('members', [controllers.Members, 'index']).as('members.index')
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
      .post('api/register/:organisationSlug/:schoolSlug/purchases', [
        controllers.CustomerPurchases,
        'store',
      ])
      .as('customer_purchases.store')
    router
      .get('api/register/:organisationSlug/:schoolSlug/purchases/verify', [
        controllers.CustomerPurchases,
        'verify',
      ])
      .as('customer_purchases.verify')
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
router
  .post('api/paystack/webhook', [controllers.PaystackWebhooks, 'store'])
  .as('paystack_webhooks.store')

// Admin sign-ups list — active-school scoped, permission-gated.
router
  .group(() => {
    router.get('signups', [controllers.Signups, 'index'])
    router
      .patch('signups/:id', [controllers.Signups, 'update'])
      .where('id', router.matchers.number())
      .as('signups.update')
  })
  .use(middleware.auth())
  .use(middleware.forcePasswordChange())
  .use(middleware.completeProfile())
  .use(middleware.activeSchool())
  .use(middleware.authorize('signup.view'))

// Learner placement into active classes.
router
  .group(() => {
    router.get('enrolment', [controllers.Enrolments, 'index']).as('enrolment.index')
    router
      .get('learners/:id', [controllers.Learners, 'show'])
      .as('learners.show')
      .where('id', router.matchers.number())
    router
      .post('enrolment/place', [controllers.Enrolments, 'place'])
      .as('enrolment.place')
      .use(middleware.authorize('enrolment.place'))
    router
      .post('enrolment/withdraw', [controllers.Enrolments, 'withdraw'])
      .as('enrolment.withdraw')
      .use(middleware.authorize('enrolment.withdraw'))
  })
  .use(middleware.auth())
  .use(middleware.forcePasswordChange())
  .use(middleware.completeProfile())
  .use(middleware.activeSchool())
  .use(middleware.authorize('enrolment.view'))

// Swim programs — curriculum management plus stage staffing (Admin/Head Coach
// only; instructors work from Classes/Lessons). Also per-level fee/availability.
router
  .group(() => {
    router
      .resource('programs', controllers.Programs)
      .where('id', router.matchers.number())
      .use('*', middleware.authorize('program.manage'))

    router
      .get('levels/:id', [controllers.Levels, 'show'])
      .where('id', router.matchers.number())
      .use(middleware.authorize('program.manage'))

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

    router
      .resource('age-groups', controllers.SchoolAgeGroups)
      .only(['store', 'update', 'destroy'])
      .as('school_age_groups')
      .where('id', router.matchers.number())
  })
  .prefix('settings')
  .use(middleware.auth())
  .use(middleware.forcePasswordChange())
  .use(middleware.completeProfile())
  .use(middleware.activeSchool())
  .use(middleware.authorize('settings.manage'))

// Curriculum banks — school-managed bank content used by stages and lesson planning.
router
  .group(() => {
    router
      .resource('skill-bank', controllers.SkillBankSkills)
      .only(['index', 'store', 'update', 'destroy'])
      .as('skill_bank')
      .where('id', router.matchers.number())

    router
      .resource('bank-packs', controllers.BankPacks)
      .only(['index', 'update'])
      .as('bank_packs')
      .where('id', router.matchers.number())

    router
      .resource('skill-bank-families', controllers.SkillBankFamilies)
      .only(['store', 'update', 'destroy'])
      .as('skill_bank_families')
      .where('id', router.matchers.number())

    router
      .resource('activity-bank', controllers.ActivityBankActivities)
      .only(['index', 'store', 'update', 'destroy'])
      .as('activity_bank')
      .where('id', router.matchers.number())

    router
      .resource('activity-bank-categories', controllers.ActivityBankCategories)
      .only(['update', 'destroy'])
      .as('activity_bank_categories')
      .where('id', router.matchers.number())
  })
  .use(middleware.auth())
  .use(middleware.forcePasswordChange())
  .use(middleware.completeProfile())
  .use(middleware.activeSchool())
  .use(middleware.authorize('program.manage'))

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
      .post('classes/:id/duplicate', [controllers.SwimmingClasses, 'duplicate'])
      .as('swimming_classes.duplicate')
      .where('id', router.matchers.number())
      .use(middleware.authorize('class.manage'))

    router
      .post('classes/:id/lessons', [controllers.ClassLessons, 'store'])
      .as('class_lessons.store')
      .where('id', router.matchers.number())
      .use(middleware.authorize('lesson.generate'))

    router
      .get('lessons', [controllers.LessonSchedules, 'index'])
      .as('lessons.index')
      .use(middleware.authorize('class.view'))

    router
      .post('lessons', [controllers.LessonSchedules, 'store'])
      .as('lessons.store')
      .use(middleware.authorize('lesson.generate'))

    router
      .patch('class-lessons/:id', [controllers.ClassLessons, 'update'])
      .as('class_lessons.update')
      .where('id', router.matchers.number())
      .use(middleware.authorize('lesson.edit'))

    router
      .patch('class-lessons/:id/activities', [controllers.ClassLessons, 'updateActivities'])
      .as('class_lessons.activities_update')
      .where('id', router.matchers.number())
      .use(middleware.authorize('lesson.activities.manage'))

    router
      .post('class-lessons/:id/copy-activities', [controllers.ClassLessons, 'copyActivities'])
      .as('class_lessons.copy_activities')
      .where('id', router.matchers.number())
      .use(middleware.authorize('lesson.activities.manage'))

    router
      .patch('class-lessons/:id/plan', [controllers.ClassLessons, 'updatePlan'])
      .as('class_lessons.update_plan')
      .where('id', router.matchers.number())
      .use(middleware.authorize('lesson.edit'))

    // Instructors are staffed per curriculum stage (per school) — a management
    // action, done from the Programs page by Admin/Head Coach.
    router
      .patch('stages/instructors', [controllers.StageInstructors, 'update'])
      .as('stages.assign_instructors')
      .use(middleware.authorize('program.manage'))

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
