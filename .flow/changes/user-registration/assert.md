---
built: 2026-07-01
---

# User Registration — Test Plan

> Stack: AdonisJS + Inertia React
> Source: .flow/changes/user-registration/blueprint.md
> Date: 2026-07-01

## Summary

Ten browser tests covering passwordless registration: requesting a sign-in link (with no-enumeration), verifying a magic link (create-or-login, redirect on profile state, expired-link failure), completing the profile (required name/phone, optional country), the completion gate on the dashboard, and retirement of the old signup route.

## Pre-implementation requirements

- `UserFactory` — `database/factories/user_factory.ts`. Default state = incomplete (email only; `fullName`/`phone`/`profileCompletedAt` null). `completed` state sets `fullName`, `phone`, `profileCompletedAt`. Passwordless — no password field. Used by T1, T4, T6, T7, T8, T9.
- `tests/bootstrap.ts` — add `() => testUtils.db().migrate()` to the currently-empty `runnerHooks.setup` (no migrated test schema otherwise).
- `.env.test` — point `DB_*` at a dedicated throwaway database (verify `config/database.ts`); the suite migrates + truncates it every run and must not touch the dev DB.

## Coverage decisions

Reads: testing.md

> This is the scope inventory for this change — every behavior the change makes observable, with a coverage decision per row. It is not the test list.

| Observable behavior                                                            | Decision | Notes                                                          |
| ------------------------------------------------------------------------------ | -------- | -------------------------------------------------------------- |
| Valid email queues a sign-in link email to that address                        | add      | —                                                              |
| Sign-in submit shows the neutral "check your email" message                    | add      | —                                                              |
| Same response whether or not the email has an account                          | add      | —                                                              |
| Malformed email re-renders with a validation error                             | add      | —                                                              |
| Malformed email queues no mail                                                 | add      | —                                                              |
| A valid link for a new email creates the account                               | add      | —                                                              |
| A valid link for a new email logs in and lands on complete-profile             | add      | —                                                              |
| A valid link for an existing completed user lands on home                      | add      | —                                                              |
| Re-clicking a valid link logs the existing user in, no duplicate row           | add      | —                                                              |
| An expired link shows "request a new link" and stays on the sign-in page       | add      | —                                                              |
| An expired link does not sign in and creates no account                        | add      | —                                                              |
| Completing the profile with name and phone stamps completion and lands on home | add      | —                                                              |
| Country omitted still completes the profile                                    | add      | —                                                              |
| Missing name re-renders with an error and does not complete the profile        | add      | —                                                              |
| Missing phone re-renders with an error                                         | add      | —                                                              |
| An authenticated user without a profile is redirected to complete-profile      | add      | —                                                              |
| An authenticated user with a completed profile sees the dashboard              | add      | —                                                              |
| The old `/signup` route no longer exists                                       | add      | —                                                              |
| Logout returns to the sign-in page                                             | skip     | thin framework wiring (`auth.logout` + redirect), no branching |
| Anonymous visit to /complete-profile redirects to login                        | skip     | framework `auth()` middleware behavior, not app logic          |
| Sign-in page renders the email form                                            | skip     | covered by the store test's navigation; static render          |
| Complete-profile prefills prior partial values                                 | skip     | low value, edge; incidentally covered by the gate landing      |

## Test list (ordered)

Reads: testing.md

1. T1 [browser] — sends a sign-in link and shows the neutral message for any email
2. T2 [browser] — rejects a malformed email and sends no mail
3. T3 [browser] — a valid link for a new email creates the account, signs in, lands on complete-profile
4. T4 [browser] — a valid link for an existing completed user signs in and lands on the dashboard
5. T5 [browser] — an expired link shows "request a new link" and does not sign in
6. T6 [browser] — completing the profile with name and phone stamps completion and lands on the dashboard
7. T7 [browser] — rejects an incomplete profile and does not complete it
8. T8 [browser] — an authenticated user without a completed profile is redirected to complete-profile
9. T9 [browser] — an authenticated user with a completed profile sees the dashboard
10. T10 [browser] — the old signup route no longer exists

## Per-test contracts

Reads: testing.md

Copy tokens (resolved — Q1 answered: Vine defaults):

- `MSG_CHECK_EMAIL` = "Check your email for a sign-in link."
- `MSG_LINK_EXPIRED` = "This sign-in link has expired. Request a new one."
- `ERR_EMAIL` = "The email field must be a valid email address"
- `ERR_NAME` = "The fullName field must be defined" (blank → `null` via `convertEmptyStringsToNull`, so the `required` rule fires)
- `ERR_PHONE` = "The phone field must be defined"

### Test 1 — sends a sign-in link and shows the neutral message for any email

- **Surface:** `SignInLinks.store` — `tests/browser/sign_in_links/store.spec.ts`
- **Suite:** browser
- **Setup:**
  - Factories: row "existing account" → `UserFactory.merge({ email })`; row "new email" → none.
  - Fakes: `using fake = mail.fake()`.
  - Auth: none (guest).
  - Parameterized rows: `{ email: 'new@example.com' }`, `{ email: <existing user's email> }`.
- **Action:** visit `route('sign_in_links.create')`, fill "Email", click "Send sign-in link".
- **Outcome contract:**
  - `fake.mails.assertQueued(MagicLinkMail, (m) => m.message.hasTo(email))`.
  - `page.assertVisible('text=<MSG_CHECK_EMAIL>')` — identical for both rows.
  - Post-action path: `route('sign_in_links.create')`.
- **Does NOT assert:** the link's contents/signature; account-existence difference between rows.
- **Why:** blueprint `Controllers` → `SignInLinks.store` queues `MagicLinkMail`; no-enumeration business rule.

### Test 2 — rejects a malformed email and sends no mail

- **Surface:** `SignInLinks.store` — `tests/browser/sign_in_links/store.spec.ts`
- **Suite:** browser
- **Setup:** Fakes: `using fake = mail.fake()`. Auth: none.
- **Action:** visit `route('sign_in_links.create')`, fill "Email" with `not-an-email`, click "Send sign-in link".
- **Outcome contract:**
  - Post-action path: `route('sign_in_links.create')` (re-rendered).
  - `page.assertVisible('text=<ERR_EMAIL>')`.
  - `fake.mails.assertNoneQueued()`.
- **Does NOT assert:** which validation rule fired internally.
- **Why:** `storeSignInLinkValidator` email rule; failed validation queues nothing.

### Test 3 — a valid link for a new email creates the account, signs in, lands on complete-profile

- **Surface:** `Sessions.store` — `tests/browser/sessions/store.spec.ts`
- **Suite:** browser
- **Setup:**
  - Other: build `const url = signedUrlFor('auth.verify', { email: 'new@example.com' }, { expiresIn: '15 minutes' })`.
  - Auth: none before visit.
- **Action:** `visit(url)`.
- **Outcome contract:**
  - Post-action path: `route('accounts.edit')` (`/complete-profile`).
  - `db.assertHas('users', { email: 'new@example.com' })`.
  - Authenticated: `page.assertVisible(page.getByRole('button', { name: 'Logout' }))`.
- **Does NOT assert:** profile field values (none yet).
- **Why:** `Sessions.store` — valid signature → `firstOrCreate` (create) → login → redirect on `isProfileComplete=false`.

### Test 4 — a valid link for an existing completed user signs in and lands on the dashboard

- **Surface:** `Sessions.store` — `tests/browser/sessions/store.spec.ts`
- **Suite:** browser
- **Setup:**
  - Factories: `const user = await UserFactory.apply('completed').create()`.
  - Other: `const url = signedUrlFor('auth.verify', { email: user.email }, { expiresIn: '15 minutes' })`.
  - Auth: none before visit.
- **Action:** `visit(url)`.
- **Outcome contract:**
  - Post-action path: `route('home')` (`/`).
  - `db.assertCount('users', 1)` — no duplicate row.
  - Authenticated: `page.getByRole('button', { name: 'Logout' })` visible.
- **Does NOT assert:** dashboard content specifics.
- **Why:** `firstOrCreate` (find) → login → `isProfileComplete=true` → home; also proves "re-clicked valid link logs the existing user in".

### Test 5 — an expired link shows "request a new link" and does not sign in

- **Surface:** `Sessions.store` — `tests/browser/sessions/store.spec.ts`
- **Suite:** browser
- **Setup:**
  - Other: `const url = signedUrlFor('auth.verify', { email: 'ghost@example.com' }, { expiresIn: '15 minutes' })`; then `timeTravel('16 minutes')`.
  - Auth: none.
- **Action:** `visit(url)`.
- **Outcome contract:**
  - Post-action path: `route('sign_in_links.create')` (`/login`).
  - `page.assertVisible('text=<MSG_LINK_EXPIRED>')`.
  - `db.assertMissing('users', { email: 'ghost@example.com' })`.
  - Not authenticated: `page.assertNotExists(page.getByRole('button', { name: 'Logout' }))`.
- **Does NOT assert:** distinction between expired vs tampered (same branch/outcome).
- **Why:** `hasValidSignature()` guard fails → error flash + redirect, no login, no create.

### Test 6 — completing the profile with name and phone stamps completion and lands on the dashboard

- **Surface:** `Accounts.update` — `tests/browser/accounts/update.spec.ts`
- **Suite:** browser
- **Setup:**
  - Factories: `const user = await UserFactory.create()` (incomplete). Auth: `await browserContext.loginAs(user)`.
  - Parameterized rows: `{ country: 'Ghana' }`, `{ country: undefined }`.
- **Action:** visit `route('accounts.edit')`, fill "Full name", "Phone" (and "Country" when present), click "Complete profile".
- **Outcome contract:**
  - Post-action path: `route('home')` (`/`) — landing on `/` (not bounced) proves the completion stamp let the gate pass.
  - `page.assertVisible('text=It works')` — dashboard content.
  - `db.assertHas('users', { id: user.id, full_name: 'John Doe', phone: '5551234' })` (+ `country: 'Ghana'` for row 1).
- **Does NOT assert:** the `profile_completed_at` timestamp value directly (proven behaviorally via the gate pass).
- **Why:** `Accounts.update` → `user.completeProfile(payload)` stamps completion, redirects home; gate on `/` permits the now-complete user.

### Test 7 — rejects an incomplete profile and does not complete it

- **Surface:** `Accounts.update` — `tests/browser/accounts/update.spec.ts`
- **Suite:** browser
- **Setup:**
  - Factories: `const user = await UserFactory.create()` (incomplete). Auth: `loginAs(user)`.
  - Parameterized rows: `{ fill: 'phone-only', error: ERR_NAME, typed: { phone: '5551234' } }`, `{ fill: 'name-only', error: ERR_PHONE, typed: { fullName: 'John Doe' } }`.
- **Action:** visit `route('accounts.edit')`, fill only the one provided field, click "Complete profile".
- **Outcome contract:**
  - Post-action path: `route('accounts.edit')` (re-rendered).
  - `page.assertVisible('text=<row.error>')`.
  - Not persisted: `db.assertMissing('users', { id: user.id, phone: '5551234' })` (row 1) / `db.assertMissing('users', { id: user.id, full_name: 'John Doe' })` (row 2).
- **Does NOT assert:** the untouched field's error state.
- **Why:** `updateAccountValidator` requires `fullName` + `phone`; failed validation saves nothing.

### Test 8 — an authenticated user without a completed profile is redirected to complete-profile

- **Surface:** home completion gate — `tests/browser/home/index.spec.ts`
- **Suite:** browser
- **Setup:** Factories: `const user = await UserFactory.create()` (incomplete). Auth: `loginAs(user)`.
- **Action:** `visit(route('home'))`.
- **Outcome contract:** Post-action path: `route('accounts.edit')` (`/complete-profile`).
- **Does NOT assert:** the complete-profile form contents.
- **Why:** `CompleteProfileMiddleware` bounces incomplete profiles off `/`.

### Test 9 — an authenticated user with a completed profile sees the dashboard

- **Surface:** home completion gate — `tests/browser/home/index.spec.ts`
- **Suite:** browser
- **Setup:** Factories: `const user = await UserFactory.apply('completed').create()`. Auth: `loginAs(user)`.
- **Action:** `visit(route('home'))`.
- **Outcome contract:** Post-action path: `route('home')` (`/`); `page.assertVisible('text=It works')`.
- **Does NOT assert:** dashboard specifics beyond one stable marker.
- **Why:** the gate permits a complete profile through to the dashboard.

### Test 10 — the old signup route no longer exists

- **Surface:** signup retirement — `tests/browser/auth/signup.spec.ts`
- **Suite:** browser
- **Setup:** none.
- **Action:** `visit('/signup')` (raw path — the route name is gone).
- **Outcome contract:**
  - `page.assertNotExists(page.getByRole('button', { name: 'Sign up' }))` — no signup form.
  - `page.assertVisible('text=Page not found')` — the not-found page renders.
- **Does NOT assert:** the HTTP status code (browser client renders the Inertia error page).
- **Why:** passwordless replaces email+password signup; the `signup` routes were removed.

## Factories audit

Reads: testing.md

- `UserFactory` — **new** (`database/factories/user_factory.ts`), `completed` state. Used by: T1 (existing-email row), T4, T6, T7, T8, T9.

## Fakes audit

Reads: testing.md

- `mail.fake()` — built-in. Used by: T1 (`fake.mails.assertQueued`), T2 (`fake.mails.assertNoneQueued`).
- No container swaps (no own-code services faked); no emitter/hash/drive fakes.

## Order rationale

Surfaces follow the user journey (request link → verify → complete profile → gate → retirement) for readability; every test self-seeds via `UserFactory` and `loginAs`, so no test depends on another's data.

## Runner-model risks

Reads: testing.md

- **Shared DB state** (sequential single-process runner): every spec group applies `group.each.setup(() => testUtils.db().truncate())`. Critical for T4's `db.assertCount('users', 1)` and all `db.assert*` tests.
- **Test schema:** `runnerHooks.setup` must run `testUtils.db().migrate()` (Pre-implementation requirement).
- `mail.fake()` and `timeTravel` use `using`/auto-restore — no cross-test leak.
- Otherwise none identified.

## Open questions

- **Q1 — RESOLVED (user chose A: Vine defaults).** Validation copy uses Vine default per-field messages (no custom-message layer); the brief's combined "Name and phone number are required." is treated as product intent, not literal copy. Resolved strings are pinned in the copy-tokens block under `## Per-test contracts`. Flash strings `MSG_CHECK_EMAIL` / `MSG_LINK_EXPIRED` confirmed as proposed.

---
