---
planned: 2026-07-02
built: 2026-07-02
---

# Register Learner — Implementation Plan

> Task type: greenfield
> Stack: AdonisJS + Inertia React
> Database: SQLite

## Summary

A public, per-club learn-to-swim sign-up form (no login) that captures one contact plus one-or-more learners and belongs to a specific club, resolved by a human-readable public slug on the club. Each sign-up emails the club's Administrator and Head Coach and appears in a read-only, active-club-scoped list gated by a new `signup.view` permission.

## Pre-implementation requirements

_None._ Every capability is covered by installed packages (`@adonisjs/mail`, `@adonisplus/permissions`, `mjml`) and the AdonisJS `string.slug` helper. No new package.

## Out of scope

- A dedicated public layout for the sign-up pages — they render inside the existing global default layout (header logo + Login link). Building a separate marketing/public layout is a broader change.
- Pagination on the admin sign-ups list — the brief frames it as a simple read-only list; add later if volume warrants.
- Editing, status, conversion to member/learner records, or deletion of sign-ups — the brief fixes the list as read-only.
- Club rename semantics for the slug — clubs have no rename flow today; the slug is generated once at founding.

## Target shape

A new `signups` capability: `signups` + `learners` tables (one-to-many), a `clubs.slug` public identifier, a `SignupsController` (public `create`/`store`, admin `index`), a `SignupCaptureService` that atomically persists the sign-up and emails club staff, a `signup.view` permission granted to Administrator + Head Coach, and three Inertia pages (public form, confirmation via flash, admin list). Club founding is extended to generate a unique slug.

## Logical schema

Reads: models.md, model-relationships.md, migrations.md, schema-rules.md

```dbml
Table clubs {
  // existing columns unchanged
  slug varchar [not null, unique]   // public sign-up link identifier
}

Table signups {
  id integer [pk, increment]
  club_id integer [not null, ref: > clubs.id]   // onDelete cascade
  contact_name varchar [not null]
  contact_email varchar [not null]
  contact_phone varchar [not null]
  whatsapp varchar [null]                         // optional
  message text [null]                             // optional, whole sign-up
  created_at timestamp [not null]
  updated_at timestamp [null]

  indexes {
    club_id [name: 'signups_club_id_index']
  }
}

Table learners {
  id integer [pk, increment]
  signup_id integer [not null, ref: > signups.id] // onDelete cascade
  name varchar [not null]
  date_of_birth date [not null]                    // @column.date -> Luxon DateTime
  gender varchar [not null]                         // 'Male' | 'Female', app-enforced
  nationality varchar [not null]
  residential_location varchar [not null]
  medical_info text [not null]                      // 'None' when nothing to report
  swimming_experience text [null]                   // optional
  created_at timestamp [not null]
  updated_at timestamp [null]

  indexes {
    signup_id [name: 'learners_signup_id_index']
  }
}
```

- **Gender** is stored as a string (`'Male'`/`'Female'`) enforced at the app layer via `app/values/gender.ts` + a `vine.enum`, mirroring the existing `RoleName` string-enum precedent. No `tinyint` and no `schema_rules.ts` narrowing needed — `slug`, `gender`, `medical_info` all emit as `string` and `date_of_birth` as `@column.date` under generator defaults.
- **`medical_info`** is `notNullable` with no DB default; the "None" sentinel is a validator-layer rule (non-empty required), not a database concern.
- Both FKs are `onDelete('CASCADE')` (club → its signups → their learners). No unique constraints across sign-ups and no status/soft-delete columns — duplicates are allowed and the list is read-only.
- `clubs.slug` is unique and backfilled for existing rows (see migrations).

## Migrations + models

Reads: migrations.md, models.md

`node ace make:migration add_slug_to_clubs --alter=clubs`
`node ace make:migration create_signups_table --create=signups`
`node ace make:migration create_learners_table --create=learners`

Migration files (ordered):

- `..._add_slug_to_clubs.ts` — `alterTable`: add `slug` **nullable** → `this.defer` backfill (for each existing club, `string.slug(name, { lower: true, strict: true })`, disambiguating collisions against already-assigned slugs with a `-2`/`-3` suffix) → second `alterTable`: `dropNullable('slug')` and `table.unique(['slug'])`. DDL → deferred backfill → tighten, in registration order per migrations.md.
- `..._create_signups_table.ts` — `signups` with `club_id` FK → `clubs.id` `onDelete('CASCADE')`, `index('club_id')`, two explicit `timestamp('created_at')` / `timestamp('updated_at')` calls.
- `..._create_learners_table.ts` — `learners` with `signup_id` FK → `signups.id` `onDelete('CASCADE')`, `index('signup_id')`, `date('date_of_birth')`, `text('medical_info')`/`text('swimming_experience')`, two explicit timestamps.

`node ace make:model Signup`
`node ace make:model Learner`

Model files:

- `app/models/club.ts` (modified) — add `@hasMany(() => Signup)` `declare signups`. `slug` is a generated schema column (no model change beyond the relationship).
- `app/models/signup.ts` (new) — `Signup extends SignupSchema`.
  - `@belongsTo(() => Club)` `declare club`
  - `@hasMany(() => Learner)` `declare learners`
- `app/models/learner.ts` (new) — `Learner extends LearnerSchema`.
  - `@belongsTo(() => Signup)` `declare signup`
  - Gender is a plain string column; `date_of_birth` emits `@column.date` (Luxon `DateTime`). No getters.

New values file (not a model export):

- `app/values/gender.ts` — `export const Gender = { MALE: 'Male', FEMALE: 'Female' } as const` + `export type Gender = (typeof Gender)[keyof typeof Gender]`.

`node ace migration:run`

## Service design

Reads: controllers.md (services section), services.md

- `app/services/signup_capture_service.ts` — `SignupCaptureService`.
  - `capture(club: Club, data: { contactName; contactEmail; contactPhone; whatsapp?; message?; learners: LearnerInput[] }): Promise<Signup>` — in a single `db.transaction`: create the `Signup` (bound to the trx via `{ client: trx }`, `clubId = club.id`) then `signup.related('learners').createMany(data.learners)` (inherits the trx). After the transaction commits, resolve recipient emails (below) and `mail.sendLater(new SignupNotificationMail(...))` one message per recipient. Returns the `Signup`.
    - Recipient resolution: `Membership.query().where('clubId', club.id).whereHas('roles', (r) => r.whereIn('name', [RoleName.ADMINISTRATOR, RoleName.HEAD_COACH])).preload('user')`, mapped to `membership.user.email`. Roles are global rows; the two role names come from `#values/role`.
    - Mail is queued **after** commit (outside the trx callback, since `db.transaction` resolves post-commit) so a rolled-back sign-up never notifies.
  - Does NOT: validate (controller does), authorize, render, flash, or redirect — HTTP concerns stay in the controller per services.md.
- `app/services/club_founding_service.ts` (modified) — `found()` gains slug generation: compute `string.slug(name, { lower: true, strict: true })`, ensure uniqueness by querying `clubs` for existing slugs within the trx and appending a `-2`/`-3` suffix until free, and pass `slug` into `Club.create({ ... }, { client: trx })`. (The add-slug migration's backfill mirrors this collision logic for pre-existing clubs — minor, accepted duplication.)

`node ace make:service signup_capture`

`LearnerInput` type lives in project-root `types/` (not exported from a model/service file).

## Validation

Reads: validation.md, vine/types/string.md, vine/types/date.md, vine/types/enum.md, vine/types/array.md, vine/types/object.md

`node ace make:validator signup`

```ts title="app/validators/signup.ts"
import vine from '@vinejs/vine'
import { Gender } from '#values/gender'

export const storeSignupValidator = vine.create({
  contactName: vine.string().trim().minLength(1).maxLength(120),
  contactEmail: vine.string().trim().normalizeEmail().email().maxLength(254),
  contactPhone: vine.string().trim().minLength(1).maxLength(40),
  whatsapp: vine.string().trim().maxLength(40).optional(),
  message: vine.string().trim().maxLength(2000).optional(),
  learners: vine
    .array(
      vine.object({
        name: vine.string().trim().minLength(1).maxLength(120),
        dateOfBirth: vine.date(),
        gender: vine.enum([Gender.MALE, Gender.FEMALE]),
        nationality: vine.string().trim().minLength(1).maxLength(80),
        residentialLocation: vine.string().trim().minLength(1).maxLength(200),
        medicalInfo: vine.string().trim().minLength(1).maxLength(2000),
        swimmingExperience: vine.string().trim().maxLength(2000).optional(),
      })
    )
    .minLength(1),
})
```

- `vine.date()` output is globally transformed to Luxon `DateTime` in `start/validator.ts`, ready for the `@column.date` learner column.
- `.minLength(1)` on `learners` enforces the "at least one learner" rule; the missing/empty-field cases are covered by each field's required chain. Global Vine messages handle the "what is missing" copy (no custom messages unless requested).

### Business rules

- The **club** is not a validated body field — it is resolved from the `:slug` route param in the controller (`Club.findByOrFail('slug', params.slug)` → 404 when unknown). Owner: controller.

## Authorization + segregation

Reads: authentication.md, authorization.md

App is **scope-membership** (permissions resolve through the active-club `Membership`); the existing `authorize_middleware.ts` already loads the active membership and calls `permissions.createAccessFor(membership)` — no middleware change.

- `start/permissions.ts` (modified):
  - Add `signup: { view: 'View learn-to-swim sign-ups' }` to `definePermissions(...)`.
  - Add `permissions.getKey('signup.view')` to both `rolePermissions[RoleName.ADMINISTRATOR]` and `rolePermissions[RoleName.HEAD_COACH]`.
- `node ace make:migration grant_signup_view_permission` — `..._grant_signup_view_permission.ts`: `this.defer` iterates `rolePermissions` and `update({ permissions: JSON.stringify(keys) })` per role name (mirrors `..._create_assign_invitation_permissions_table.ts`); `down` resets those roles to the prior key set. Grants the new key to existing global Administrator + Head Coach role rows so `authorize('signup.view')` passes.
- No policy class — this is a pure permission-key gate with no per-row ownership.
- Query segregation:
  - `SignupsController.index` — `Signup.query().where('clubId', user.activeClubId!).preload('learners').orderBy('created_at', 'desc')`. Scoped to the authenticated user's active club.

## Controllers

Reads: controllers.md, http-context.md, request.md, middleware.md, model-relationships.md

- `app/controllers/signups_controller.ts` (new) — `SignupsController`.
  - `create` — wiring: `Club.findByOrFail('slug', params.slug)`, `inertia.render('signups/create', { club: { name }, genders })`. Public. Renders the club name + gender options (`[Gender.MALE, Gender.FEMALE]`).
    - 404 when the slug is unknown (`findByOrFail`), surfaced by the global exception handler.
  - `store` — wiring: resolve club by slug (`findByOrFail`), `request.validateUsing(storeSignupValidator)`, `signupCapture.capture(club, payload)`, `session.flash('success', ...)`, `response.redirect().toRoute('signups.create', { slug: params.slug })`. Public. Method-level `@inject()` for `SignupCaptureService`.
    - Confirmation is the flash success on redirect back to the form (PRG), rendered by the layout toast — consistent with the invitation flow. No separate confirmation page/route.
    - Validate resolves club first (param), then validates body — a missing/empty required field or zero learners throws `ValidationError`; the global handler redirects back with errors and nothing is persisted.
  - `index` — wiring: `Signup.query().where('clubId', auth.getUserOrFail().activeClubId!).preload('learners').orderBy('created_at', 'desc')`, `inertia.render('signups/index', { signups: SignupTransformer.transform(signups) })`. Gated at the route (auth + completeProfile + activeClub + `authorize('signup.view')`).
    - Preload `learners` before transform (SignupTransformer reads it).

- DI: method-level `@inject()` on `store` only (`create`/`index` need no service).
- Per-action middleware: applied at the route layer (Step 9), not on the controller.

`node ace make:controller signups`

## Response layer

Reads: transformers.md, response.md, session.md, exception-handling.md

- `app/transformers/club_transformer.ts` (modified) — add `slug` to the existing pick list so the shared `activeClub` prop carries it (the dashboard builds the public link from it).
  - Pass-through fields: `id, name, location, slug`.
- `app/transformers/signup_transformer.ts` (new) — `SignupTransformer extends BaseTransformer<Signup>`.
  - Fields needing transformation:
    - `createdAt:`
      - `raw: string` — ISO from `this.resource.createdAt.toISO()`.
      - `formatted: string` — `this.resource.createdAt.toFormat('dd LLL yyyy')` (Luxon; no i18n package installed).
    - `learners:` — `LearnerTransformer.transform(this.whenLoaded(this.resource.learners))`.
  - Pass-through fields: `id, contactName, contactEmail, contactPhone, whatsapp, message`.
  - Relationships to preload before transform: `learners` (done in `index`).
  - Runtime context required: none.
- `app/transformers/learner_transformer.ts` (new) — `LearnerTransformer extends BaseTransformer<Learner>`.
  - Fields needing transformation:
    - `dateOfBirth:`
      - `raw: string` — `this.resource.dateOfBirth.toISODate()`.
      - `formatted: string` — `this.resource.dateOfBirth.toFormat('dd LLL yyyy')`.
  - Pass-through fields: `id, name, gender, nationality, residentialLocation, medicalInfo, swimmingExperience`.
  - Relationships to preload: none.
  - Runtime context required: none.

`node ace make:transformer signup`
`node ace make:transformer learner`

## Routes

Reads: routing.md

```diff title="start/routes.ts"
+// Public learn-to-swim sign-up — no auth, club resolved by slug
+router
+  .group(() => {
+    router.get('register/:slug', [controllers.Signups, 'create'])
+    router.post('register/:slug', [controllers.Signups, 'store'])
+  })
+  .where('slug', router.matchers.slug())
+
+// Admin sign-ups list — active-club scoped, permission-gated
+router
+  .get('signups', [controllers.Signups, 'index'])
+  .use(middleware.auth())
+  .use(middleware.completeProfile())
+  .use(middleware.activeClub())
+  .use(middleware.authorize('signup.view'))
```

Auto-generated route names: `signups.create`, `signups.store`, `signups.index`. Verify route names with `node ace list:routes`.

## Events + side effects

Reads: mail.md, edge-syntax.md

No AdonisJS event/listener — consistent with the codebase (the invitation flow sends mail directly). The single side effect is the notification email, queued from `SignupCaptureService.capture()` after commit.

- `app/mails/signup_notification.ts` — `SignupNotificationMail extends BaseMail`.
  - Constructor: `(recipientEmail: string, clubName: string, signup: Signup /* with learners loaded */, listUrl: string)`.
  - `prepare()`: `to(recipientEmail)`, `subject('New learn-to-swim sign-up for ' + clubName)`, `htmlView('emails/signup_notification_html', {...})` + `textView('emails/signup_notification_text', {...})`. `listUrl` via `router.makeUrl('signups.index', {}, { prefixUrl: appUrl })` (from `#config/app`).
- `resources/views/emails/signup_notification_html.edge` — MJML (`@mjml()`), mirrors `invitation_html.edge`: contact block + a learners list + a button linking to `listUrl`.
- `resources/views/emails/signup_notification_text.edge` — plain-text counterpart.

`node ace make:mail signup_notification`

## Views

Reads: frontend.md, transformers.md, design-system.md

Existing UI is minimal/plain HTML (`className="form-container"`, `data-invalid` on fields, `<Form route=...>`, `<Guard for=...>`, `<Link route=...>`). The global default layout wraps every page (app.tsx resolver) — public pages inherit it.

- `inertia/pages/signups/create.tsx` (new) — public sign-up form; owns state + composition only.
  - Props: `{ club: { name: string }, genders: string[] }` (plain controller props, not transformer-backed).
  - Layout: global default (inherited).
  - Composes: `LearnerFields` (below) + native inputs for contact/message.
  - State: ephemeral `useState` for the list of learner rows (add/remove) — the one allowed `useState` (UI-only, not server data). Submit target: `signups.store` via `<Form route="signups.store" routeParams={{ slug }}>`; nested field names `learners[i][field]`; errors read from `errors['learners.i.field']`. `slug` comes from `usePage().url` or is passed as a prop from the controller (add `slug` to `create` props).
  - Navigation: none (public, standalone).
- `inertia/components/learner_fields.tsx` (new) — one learner's field group (name, DOB, gender select from `genders`, nationality, residential location, medical info, optional swimming experience) + a remove control. Extracted as: repeated JSX (one per learner row).
- `inertia/pages/signups/index.tsx` (new) — admin read-only list; owns composition only.
  - Props: `{ signups: Data.Signup[] }` (`InertiaProps<{ signups: Data.Signup[] }>`, `Data.Signup` from `@generated/data`).
  - Layout: global default.
  - Composes: `SignupCard`.
  - Navigation: `<Link route="home">` back to dashboard.
- `inertia/components/signup_card.tsx` (new) — renders one sign-up: contact details, optional message/whatsapp, and its learners (each learner's fields incl. `dateOfBirth.formatted`, `gender`, `medicalInfo`). Extracted as: repeated JSX (one per sign-up).
- `inertia/pages/home.tsx` (modified) — inside `<Guard for="signup.view">`: a `<Link route="signups.index">` ("View sign-ups") and the shareable public link built from `activeClub.slug` via `urlFor('signups.create', { slug: activeClub.slug })`, composed through `ShareSignupLink`.
- `inertia/components/share_signup_link.tsx` (new) — shows the public sign-up URL and a copy button; the copy handler builds the absolute URL (`window.location.origin + path`) inside the click handler (event scope, SSR-safe) and calls `navigator.clipboard`. Extracted as: page subcomponent (client-only behavior).

`node ace make:page signups/create`
`node ace make:page signups/index`

JSX/markup follows the existing plain-HTML conventions at build time.

## Test coverage gap

No existing tests cover `signups`. New tests (plan owned by `assert.md`) will need to exercise, at the browser/functional level: the public form renders the club name and submits a valid sign-up (persisted + confirmation flash + mail queued to Administrator + Head Coach); submitting with a missing required field or zero learners is rejected with nothing persisted; a repeat submission creates a second record; the admin list shows a club's sign-ups with learners and is denied to a non-Administrator/non-Head-Coach; and slug generation/uniqueness on club founding. The mailer is faked (`mail.fake()`) and assertions target `fake.mails.assertQueued(SignupNotificationMail, ...)`.
