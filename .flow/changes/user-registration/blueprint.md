---
planned: 2026-07-01
built: 2026-07-01
---

# User Registration — Implementation Plan

> Task type: extension
> Stack: AdonisJS + Inertia React
> Database: SQLite

## Summary

Replace email+password signup with passwordless sign-in via an emailed magic link (signed URL), and add a first-time profile-completion step (name + phone required, country optional) gated by middleware. One unified door handles both sign-up and sign-in: a new email creates an account on first verify, a known email logs in. Google OAuth is deferred to its own change.

## Pre-implementation requirements

- `@adonisjs/mail` — **installed during planning** (`config/mail.ts` present). Configure a working mailer (SMTP creds via `SMTP_*` env) plus a global `from`/`replyTo` in `config/mail.ts`.
- `mjml` — `npm i mjml`, required for the MJML email templates (`mail.md`). Add if missing.
- `appUrl` (from `#config/app`) must be set so `signedUrlFor(..., { prefixUrl: appUrl })` emits absolute links in email.

## Out of scope

- **Google (OAuth) sign-in** — deferred to its own change; no catalogued/ documented harness package exists yet. With Google gone for now, the sign-in screen offers only the magic-link path and the brief's "Google cancelled → offer magic link" failure mode is moot.
- **Microsoft sign-in** — later, per brief.
- **Parent accounts** — created by invitation elsewhere.
- **Account type (private/school coach) & team creation** — deferred; no roles/permissions introduced here.
- **Profile editing/viewing journey** — this change only covers first-time completion.
- **Public landing page** — `/` is the authenticated dashboard in this change.
- **Completed user visiting `/complete-profile`** — currently re-shows the form (harmless); redirect-to-home nicety deferred.

## Current shape

- `User` model composes `withAuthFinder(hash)`; `users` table has `email` (unique), `full_name` (nullable), `password` (notNullable), timestamps.
- `NewAccountController` (`create`/`store`) + `SessionController` (`create`/`store`/`destroy`) drive email+password.
- Routes: `signup`/`login` under `middleware.guest()`, `logout` under `middleware.auth()`; `/` renders `home` unauthenticated.
- Inertia: `auth/login.tsx`, `auth/signup.tsx`, `home.tsx`; `layouts/default.tsx` renders flash as `sonner` toasts and a `user.initials` chip. Shared `user` prop via existing `UserTransformer`.

## Target shape

One sign-in page emails a signed magic link. Clicking it verifies the signature, find-or-creates the user by email, logs them in, and routes to profile completion (if incomplete) or the home dashboard. Name + phone are required before the dashboard is reachable; a middleware gate enforces it on every authenticated request. No passwords anywhere.

## Logical schema

Reads: models.md, migrations.md, schema-rules.md, model-relationships.md

```dbml
Table users {
  id                   integer     [pk, increment]
  email                varchar(254)[not null, unique, note: 'identity key for magic-link find-or-create']
  full_name            varchar     [null, note: 'the "name"; required at profile completion (app-enforced)']
  phone                varchar     [null, note: 'required at profile completion (app-enforced)']
  country              varchar     [null, note: 'optional, always']
  profile_completed_at timestamp   [null, note: 'set when name+phone first provided; drives the completion gate']
  created_at           timestamp   [not null]
  updated_at           timestamp   [null]

  indexes {
    email [unique]
  }
}
```

- Passwordless: `password` column is dropped and `withAuthFinder` comes off the model. No credential-verification path remains.
- `email` stays unique and is the identity: unknown email creates a row, known email is reused.
- Completion gate keys on `profile_completed_at` (`null` ⇒ incomplete); set once when name + phone are first submitted.
- `full_name` and `phone` are DB-nullable so a row can exist between authentication and profile completion; "required" is enforced in the app at the profile step. `country` is never required.

## Migrations + models

Reads: migrations.md, models.md

`node ace make:migration passwordless_profile_columns --alter=users`

Migration files (ordered):

- `database/migrations/<ts>_passwordless_profile_columns.ts` — on `users`: add `phone` (string, nullable), `country` (string, nullable), `profile_completed_at` (timestamp, nullable); drop `password` (guarded by `hasColumn`). `down()` re-adds `password` as **nullable** (original values unrecoverable) and drops the three new columns. No backfill (no `notNullable` tightening).

`node ace migration:run` regenerates `database/schema.ts`: `UserSchema` gains `phone`, `country`, `profileCompletedAt` and loses `password`.

Model files:

- `app/models/user.ts` (modified) — `User extends UserSchema` (mixin removed).
  - Remove `compose(..., withAuthFinder(hash))` and the `hash` import — extends `UserSchema` directly.
  - `initials` getter — kept as-is.
  - `get isProfileComplete(): boolean` — `this.profileCompletedAt !== null`; read by the gate middleware.
  - `completeProfile(data: { fullName: string; phone: string; country?: string | null }): Promise<void>` — merges the fields, stamps `profileCompletedAt = DateTime.now()`, saves. Model method (entity rule).

No `make:model` (model exists).

## Service design

_n/a (task type: no services chosen)_

## Validation

Reads: validation.md, vine/types/string.md

### Input validation

Old `app/validators/user.ts` (`signupValidator`) is removed with `NewAccountController`.

`node ace make:validator sign_in_link` · `node ace make:validator account`

```ts title="app/validators/sign_in_link.ts"
import vine from '@vinejs/vine'

export const storeSignInLinkValidator = vine.create({
  email: vine.string().trim().normalizeEmail().email().maxLength(254),
})
```

```ts title="app/validators/account.ts"
import vine from '@vinejs/vine'

export const updateAccountValidator = vine.create({
  fullName: vine.string().trim().minLength(1).maxLength(255),
  phone: vine.string().trim().minLength(7).maxLength(20),
  country: vine.string().trim().maxLength(100).nullable().optional(),
})
```

### Business rules

- No uniqueness/existence check on the sign-in email — deliberate. Find-or-create at verify time accepts any well-formed email and avoids account-enumeration (identical response either way). Owner: `Sessions.store` (`firstOrCreate`).
- Magic-link authenticity is verified by the URL signature, not a validator — `request.hasValidSignature()` in `Sessions.store`. Owner: controller.
- `profile_completed_at` stamping on a valid profile submit. Owner: `User.completeProfile` model method.

## Authorization + segregation

Reads: authorization.md, authentication.md

- No policies, no permission keys, no roles introduced by this change. No `start/permissions.ts` or policy files.
- Access is authentication-based only (middleware, Step: Routes):
  - Guest-only: `SignInLinks.create`/`store`, `Sessions.store` (verify link).
  - Auth-required: `Sessions.destroy`, `Accounts.edit`/`update`.
  - Completion gate (incomplete profile → `/complete-profile`) is a middleware access rule.
- Query segregation:
  - `Accounts.edit`/`update` operate on `auth.getUserOrFail()` exclusively — the account is always the current user; no user id is accepted from params/body, so a user can only ever read/write their own account. No ownership policy needed.
  - `Sessions.store` resolves the user via the signed email in the verified URL (`firstOrCreate`), never a client-supplied id — the signature is the authorization.

## Controllers

Reads: controllers.md, authentication.md, url-builder.md, mail.md

- `app/controllers/sign_in_links_controller.ts` (new) — `SignInLinksController`.
  - `create` — `inertia.render('auth/login')` (email-entry). Plain, no props beyond shared flash.
  - `store` — wiring: `storeSignInLinkValidator` → `mail.sendLater(new MagicLinkMail(email))` → `session.flash('success', <neutral check-your-email message>)` → `response.redirect().toRoute('sign_in_links.create')`.
    - Signed URL is built inside `MagicLinkMail.prepare()` — no DB touch, no user row at request time.
    - Flash copy is neutral (no account-enumeration).
    - Ordering: validate → queue mail → flash → redirect.
- `app/controllers/sessions_controller.ts` (modified — reworks `session_controller.ts`) — `SessionsController`.
  - `store` — magic-link target. Wiring: `request.hasValidSignature()` guard → `User.firstOrCreate({ email })` → `auth.use('web').login(user)` → redirect on `user.isProfileComplete`.
    - Signature check first, before trusting `request.qs().email`. Invalid/expired → `session.flash('error', <expired: request a new link>)` + `redirect().toRoute('sign_in_links.create')`.
    - Valid signature → `firstOrCreate` creates or returns the user (unified door; a re-clicked still-valid link logs the existing user in — satisfies "already-used → log them in", no single-use tracking).
    - Redirect: `user.isProfileComplete` ? `toRoute('home')` : `toRoute('accounts.edit')`.
  - `destroy` — `auth.use('web').logout()` → `redirect().toRoute('sign_in_links.create')`.
  - Old `create` + password `store` removed.
- `app/controllers/accounts_controller.ts` (new) — `AccountsController`.
  - `edit` — `auth.getUserOrFail()` → `inertia.render('account/complete_profile', { account: AccountTransformer.transform(user) })`.
  - `update` — `auth.getUserOrFail()` → `updateAccountValidator` → `user.completeProfile(payload)` (model method) → `session.flash('success', 'Profile completed')` → `redirect().toRoute('home')`.
    - No authz call — self-scoped to the authenticated user.
    - Ordering: resolve current user → validate → completeProfile → flash → redirect.

`node ace make:controller sign_in_links` · `node ace make:controller accounts` (Sessions reworked in place; `new_account_controller.ts` removed.)

- DI: none. Constructor default; no method injection.
- Per-action middleware overrides: see Routes.

## Response layer

Reads: transformers.md

`node ace make:transformer account`

- `app/transformers/account_transformer.ts` — `AccountTransformer extends BaseTransformer<User>`.
  - Fields needing transformation: none.
  - Pass-through fields: `this.pick(this.resource, ['id', 'email', 'fullName', 'phone', 'country'])`.
  - Relationships to preload: none.
  - Runtime context required: none (synchronous `toObject()`).
- Validation failures throw; global handler redirects back with errors via Inertia shared state. Flash rides `session.flash('success' | 'error', …)` set in controllers; layout renders it as toasts. `UserTransformer` (shared `user` prop) is unchanged.

## Routes

Reads: routing.md, middleware.md

New middleware — `node ace make:middleware complete_profile`

- `app/middleware/complete_profile_middleware.ts` — `CompleteProfileMiddleware`. `handle(ctx, next)`: `const user = ctx.auth.getUserOrFail()` → if `!user.isProfileComplete` return `ctx.response.redirect().toRoute('accounts.edit')`; else `next()`. Runs after `auth()`; never applied to `accounts.edit/update` or `logout`.

```diff title="start/kernel.ts"
 export const middleware = router.named({
   // ...existing (guest, auth)...
+  completeProfile: () => import('#middleware/complete_profile_middleware'),
 })
```

```diff title="start/routes.ts"
-router.on('/').renderInertia('home', {}).as('home')
+router
+  .on('/')
+  .renderInertia('home', {})
+  .use(middleware.auth())
+  .use(middleware.completeProfile())
+  .as('home')

-router
-  .group(() => {
-    router.get('signup', [controllers.NewAccount, 'create'])
-    router.post('signup', [controllers.NewAccount, 'store'])
-
-    router.get('login', [controllers.Session, 'create'])
-    router.post('login', [controllers.Session, 'store'])
-  })
-  .use(middleware.guest())
+router
+  .group(() => {
+    router.get('login', [controllers.SignInLinks, 'create'])
+    router.post('login', [controllers.SignInLinks, 'store'])
+    router.get('auth/verify', [controllers.Sessions, 'store']).as('auth.verify')
+  })
+  .use(middleware.guest())

-router
-  .group(() => {
-    router.post('logout', [controllers.Session, 'destroy'])
-  })
-  .use(middleware.auth())
+router
+  .group(() => {
+    router.get('complete-profile', [controllers.Accounts, 'edit'])
+    router.patch('complete-profile', [controllers.Accounts, 'update'])
+    router.post('logout', [controllers.Sessions, 'destroy'])
+  })
+  .use(middleware.auth())
```

Resulting names: `sign_in_links.create`, `sign_in_links.store`, `auth.verify` (renamed — `MagicLinkMail`'s `signedUrlFor('auth.verify', …)` binds to it), `accounts.edit`, `accounts.update`, `sessions.destroy`.

Verify route names with `node ace list:routes`.

## Events + side effects

Reads: mail.md (mail class)

- No domain events, no listeners. The one side effect is the queued magic-link email (`mail.sendLater` in `SignInLinks.store`).

`node ace make:mail magic_link`

- `app/mails/magic_link.ts` — `MagicLinkMail extends BaseMail`. Constructor takes the `email` string. `prepare()` builds `signedUrlFor('auth.verify', { email }, { expiresIn: '15 minutes', prefixUrl: appUrl })` and sends `htmlView`/`textView` (`resources/views/emails/magic_link_html.edge` [MJML], `magic_link_text.edge`) with the link. `expiresIn` is the sign-in window and _is_ the "expired → request a new one" boundary.

## Views

Reads: frontend.md, design-system.md, transformers.md

- `inertia/pages/auth/login.tsx` (modified) — magic-link sign-in page (`SignInLinks.create`).
  - Props: shared only (`errors`, `flash`, `user`).
  - Remove password field; single `email` input; `<Form route="sign_in_links.store">` (POST derived); submit "Send sign-in link", `disabled={processing}`; render `errors.email`. Mirror `.form-container` / `.button`.
  - "Check your email" and expired-link messages are the success/error flash toasts (layout) — no dedicated page.
  - Composes: none new. Layout: global default (mirror existing pages — no explicit `.layout`).
- `inertia/pages/account/complete_profile.tsx` (new) — `node ace make:page account/complete_profile` (`Accounts.edit`).
  - Props: `InertiaProps<{ account: Data.Account }>` — `{ id, email, fullName, phone, country }`, matches `AccountTransformer`.
  - `<Form route="accounts.update">` (PATCH derived). Fields: `fullName` (text, `defaultValue={account.fullName ?? ''}`), `phone` (tel, `defaultValue={account.phone ?? ''}`), `country` (text, optional, `defaultValue={account.country ?? ''}`). Render `errors.fullName`/`errors.phone`/`errors.country`. Submit "Complete profile", `disabled={processing}`. Mirror `.form-container` / `.button`.
  - Form submit target: `AccountsController.update`. Navigation: none. Composes: none new.
- `inertia/pages/auth/signup.tsx` (removed) — no separate signup surface.
- `inertia/pages/home.tsx` (unchanged) — now the post-registration landing behind `auth` + `completeProfile`.
- `inertia/layouts/default.tsx` (modified) — nav route-name updates: logout `<Form route="session.destroy">` → `route="sessions.destroy"`; remove the `new_account.create` "Signup" link; point the "Login" link `session.create` → `sign_in_links.create`. User chip (`user.initials`) unchanged.

No new component files — auth/profile forms are page-owned JSX, matching the existing inline-form convention.

## Test coverage gap

No existing tests in `tests/`. New coverage required (plan owned by assert.md), all viable with the Japa browser client + `mail.fake()` (`mail.md`):

- Requesting a link: `POST /login` with a valid email queues `MagicLinkMail` to that address and flashes the neutral message; invalid email re-renders with `errors.email`; the response is identical for known vs unknown emails (no enumeration).
- Verifying: a valid signed link with a new email creates the account, logs in, and redirects to `/complete-profile`; with a known completed email redirects to `/`; a tampered/expired signature flashes the expired-link error and redirects to `/login`; re-clicking a still-valid link logs the existing user in.
- Profile completion: `PATCH /complete-profile` with name+phone stamps `profile_completed_at` and lands on `/`; missing name or phone re-renders with field errors; country omitted succeeds.
- Completion gate: an authenticated user with no profile hitting `/` is redirected to `/complete-profile`; once complete, `/` renders; the gate never loops on `/complete-profile` itself.
- Passwordless invariant: the old `/signup` route and password login no longer exist.
