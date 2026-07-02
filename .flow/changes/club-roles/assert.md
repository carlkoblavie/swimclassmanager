---
built: 2026-07-01
---

# Club Roles — Test Plan

> Stack: AdonisJS + Inertia React
> Source: .flow/changes/club-roles/blueprint.md
> Date: 2026-07-01

## Summary

Ten tests covering club founding (create a club → become its Administrator → active-club dashboard), the required-field and founder-scoped case-insensitive duplicate rules, multi-club active switching, the home active-club gate, the role catalog seed, and the three existing registration/profile tests whose home landing is now club-gated.

## Pre-implementation requirements

- **`ClubFactory`** — `database/factories/club_factory.ts`. Default: `name` + `location` (faker); the founder is supplied via `.merge({ createdByUserId: user.id })` (FK is `notNullable`). Used by tests 3, 4, 5, 6.
- **`seedRoles()` helper** — `tests/helpers.ts`. Idempotent insert of the six `RoleName` roles (`permissions: '[]'`). Run in `group.each.setup` **after** `truncate()` for the founding group (tests 1–5) and the roles-catalog group (test 10). Used by tests 1, 4, 5, 10.

## Coverage decisions

Reads: testing.md

> This is the scope inventory for this change — every behavior the change makes observable, with a coverage decision per row. It is not the test list.

| Observable behavior                                                                                                                                       | Decision | Notes                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| Create-club form renders for a profile-complete user                                                                                                      | skip     | covered by store tests' navigation; static render                                                                       |
| Valid submit creates the club                                                                                                                             | add      | —                                                                                                                       |
| Valid submit makes the founder the club's Administrator                                                                                                   | dedup    | → founding test                                                                                                         |
| Valid submit lands on the home dashboard showing the new club                                                                                             | dedup    | → founding test                                                                                                         |
| Submitting without a name re-renders with an error and creates no club                                                                                    | add      | —                                                                                                                       |
| Submitting without a location re-renders with an error and creates no club                                                                                | add      | —                                                                                                                       |
| A duplicate name + location (case-insensitive) for the founder re-renders with "You already have a club with this name and location." and creates no club | add      | —                                                                                                                       |
| The same name at a different location creates the club                                                                                                    | add      | —                                                                                                                       |
| Creating a second club switches the active club to the newer one                                                                                          | add      | —                                                                                                                       |
| The six roles are seeded and present                                                                                                                      | add      | —                                                                                                                       |
| A profile-complete user with no active club visiting `/` is redirected to create a club                                                                   | add      | —                                                                                                                       |
| A profile-complete user with an active club sees the home dashboard showing the club                                                                      | change   | browser/home/index.spec.ts:an authenticated user with a completed profile sees the dashboard                            |
| Completing the profile with name and phone lands the user on create-a-club                                                                                | change   | browser/accounts/update.spec.ts:completing the profile with name and phone stamps completion and lands on the dashboard |
| An existing completed user with no club opening a valid magic link signs in and lands on create-a-club                                                    | change   | browser/sessions/store.spec.ts:a valid link for an existing completed user signs in and lands on the dashboard          |
| An authenticated user without a completed profile is redirected to complete-profile                                                                       | keep     | browser/home/index.spec.ts:an authenticated user without a completed profile is redirected to complete-profile          |
| Submitting an incomplete profile re-renders with an error and does not complete it                                                                        | keep     | browser/accounts/update.spec.ts:rejects an incomplete profile and does not complete it                                  |

## Test list (ordered)

Reads: testing.md

1. T1 [browser] — founds a club, makes the founder its Administrator, and lands on the dashboard
2. T2 [browser] — rejects a submission missing a required field and creates no club
3. T3 [browser] — rejects a duplicate name + location for the founder and creates no club
4. T4 [browser] — allows the same name at a different location
5. T5 [browser] — creating a second club switches the active club to the newer one
6. T6 [browser] — a profile-complete user with an active club sees the home dashboard showing the club
7. T7 [browser] — a profile-complete user with no active club is redirected to create a club
8. T8 [browser] — completing the profile with name and phone lands the user on create-a-club
9. T9 [browser] — an existing completed user with no club opens a valid magic link and lands on create-a-club
10. T10 [unit] — the role catalog contains the six defined roles

## Per-test contracts

Reads: testing.md

Copy tokens (resolved):

- `MSG_DUPLICATE` = "You already have a club with this name and location."
- `ERR_NAME_REQUIRED` = "The name field must be defined"
- `ERR_LOCATION_REQUIRED` = "The location field must be defined" (Vine defaults — empty→`null` via `convertEmptyStringsToNull`, required rule fires; follows the registration precedent)

Fixed test data: club `Aqua Swim Club` / `Accra`; alt location `Kumasi`; second club `Tornado Club`; profile `John Doe` / `5551234`.

### Test 1 — founds a club, makes the founder its Administrator, and lands on the dashboard

- **Surface:** `ClubsController.store` — `tests/browser/clubs/store.spec.ts`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory.apply('completed').create()`.
  - Fakes: none.
  - Auth: `browserContext.loginAs(user)`.
  - Other: `group.each.setup` → `truncate()` then `seedRoles()`.
- **Action:** visit `route('clubs.create')`, fill "Name" = `Aqua Swim Club`, "Location" = `Accra`, click "Create club".
- **Outcome contract:**
  - Post-action path: `route('home')` (`/`).
  - Rendered DOM: `assertVisible('text=Aqua Swim Club')` and `assertVisible('text=Accra')`.
  - DB: `db.assertHas('clubs', { name: 'Aqua Swim Club', location: 'Accra', created_by_user_id: user.id })`; the founder's membership is linked to the **Administrator** role (`memberships` row for `{ club, user }` joined through `membership_roles` to `roles.name = 'Administrator'`); `db.assertHas('users', { id: user.id, active_club_id: <new club id> })`.
- **Does NOT assert:** the success flash text (copy is an open question); the create-form heading.
- **Why:** `ClubsController.store` → `ClubFoundingService.found` (club + founder membership + Administrator grant + active club) → redirect home.

### Test 2 — rejects a submission missing a required field and creates no club

- **Surface:** `ClubsController.store` — `tests/browser/clubs/store.spec.ts`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory.apply('completed').create()`. Auth: `loginAs(user)`. `seedRoles()`.
  - Parameterized rows: `{ fill: 'location-only', typed: { location: 'Accra' }, error: ERR_NAME_REQUIRED }`, `{ fill: 'name-only', typed: { name: 'Aqua Swim Club' }, error: ERR_LOCATION_REQUIRED }`.
- **Action:** visit `route('clubs.create')`, fill only the provided field, click "Create club".
- **Outcome contract:**
  - Post-action path: `route('clubs.create')` (re-rendered).
  - Rendered DOM: `assertVisible('text=<row.error>')`.
  - DB: `db.assertCount('clubs', 0)`.
- **Does NOT assert:** the untouched field's error state.
- **Why:** `storeClubValidator` requires `name` + `location`; failed validation founds nothing.

### Test 3 — rejects a duplicate name + location for the founder and creates no club

- **Surface:** `ClubsController.store` — `tests/browser/clubs/store.spec.ts`
- **Suite:** browser
- **Setup:**
  - Factories: `const user = UserFactory.apply('completed').create()`; `ClubFactory.merge({ createdByUserId: user.id, name: 'Aqua Swim Club', location: 'Accra' }).create()`. Auth: `loginAs(user)`. `seedRoles()`.
- **Action:** visit `route('clubs.create')`, fill "Name" = `aqua swim club`, "Location" = `ACCRA` (deliberately different case), click "Create club".
- **Outcome contract:**
  - Post-action path: `route('clubs.create')`.
  - Rendered DOM: `assertVisible('text=<MSG_DUPLICATE>')`.
  - DB: `db.assertCount('clubs', 1)` — no second club.
- **Does NOT assert:** which cased value matched internally.
- **Why:** `uniqueClubForFounder` (founder-scoped, case-insensitive) rejects; nothing founded.

### Test 4 — allows the same name at a different location

- **Surface:** `ClubsController.store` — `tests/browser/clubs/store.spec.ts`
- **Suite:** browser
- **Setup:**
  - Factories: `const user = UserFactory.apply('completed').create()`; `ClubFactory.merge({ createdByUserId: user.id, name: 'Aqua Swim Club', location: 'Accra' }).create()`. Auth: `loginAs(user)`. `seedRoles()`.
- **Action:** visit `route('clubs.create')`, fill "Name" = `Aqua Swim Club`, "Location" = `Kumasi`, click "Create club".
- **Outcome contract:**
  - Post-action path: `route('home')`.
  - DB: `db.assertCount('clubs', 2)`; `db.assertHas('clubs', { name: 'Aqua Swim Club', location: 'Kumasi', created_by_user_id: user.id })`.
  - Rendered DOM: `assertVisible('text=Kumasi')`.
- **Does NOT assert:** the Administrator grant (covered by Test 1).
- **Why:** the duplicate rule keys on `name` + `location` together; a different location is not a duplicate.

### Test 5 — creating a second club switches the active club to the newer one

- **Surface:** `ClubsController.store` — `tests/browser/clubs/store.spec.ts`
- **Suite:** browser
- **Setup:**
  - Factories: `const user = UserFactory.apply('completed').create()`; `const first = ClubFactory.merge({ createdByUserId: user.id, name: 'Aqua Swim Club', location: 'Accra' }).create()`; then `user.merge({ activeClubId: first.id }).save()`. Auth: `loginAs(user)`. `seedRoles()`.
- **Action:** visit `route('clubs.create')`, fill "Name" = `Tornado Club`, "Location" = `Kumasi`, click "Create club".
- **Outcome contract:**
  - Post-action path: `route('home')`.
  - Rendered DOM: `assertVisible('text=Tornado Club')` (dashboard now shows the newer club).
  - DB: `db.assertHas('users', { id: user.id, active_club_id: <second club id> })`.
- **Does NOT assert:** the first club's continued existence.
- **Why:** `ClubFoundingService` sets `founder.activeClubId` to the newly-created club.

### Test 6 — a profile-complete user with an active club sees the home dashboard showing the club

- **Surface:** home / `ActiveClubMiddleware` — `tests/browser/home/index.spec.ts` (rewrites existing "an authenticated user with a completed profile sees the dashboard")
- **Suite:** browser
- **Setup:**
  - Factories: `const user = UserFactory.apply('completed').create()`; `const club = ClubFactory.merge({ createdByUserId: user.id, name: 'Aqua Swim Club', location: 'Accra' }).create()`; `user.merge({ activeClubId: club.id }).save()`. Auth: `loginAs(user)`.
- **Action:** `visit(route('home'))`.
- **Outcome contract:**
  - Post-action path: `route('home')` (`/`).
  - Rendered DOM: `assertVisible('text=Aqua Swim Club')`.
- **Does NOT assert:** "It works" (removed); dashboard specifics beyond the club marker.
- **Why:** the active-club gate permits a user with an active club through; home renders the shared `activeClub`.

### Test 7 — a profile-complete user with no active club is redirected to create a club

- **Surface:** home / `ActiveClubMiddleware` — `tests/browser/home/index.spec.ts`
- **Suite:** browser
- **Setup:** `const user = UserFactory.apply('completed').create()` (no club, `activeClubId` null). Auth: `loginAs(user)`.
- **Action:** `visit(route('home'))`.
- **Outcome contract:** Post-action path: `route('clubs.create')` (`/clubs/create`).
- **Does NOT assert:** the create-form contents.
- **Why:** `ActiveClubMiddleware` bounces a no-active-club user off `/`.

### Test 8 — completing the profile with name and phone lands the user on create-a-club

- **Surface:** `Accounts.update` — `tests/browser/accounts/update.spec.ts` (rewrites existing "completing the profile with name and phone stamps completion and lands on the dashboard")
- **Suite:** browser
- **Setup:**
  - Factories: `const user = UserFactory.create()` (incomplete). Auth: `loginAs(user)`.
  - Parameterized rows: `{ country: 'Ghana' }`, `{ country: undefined }`.
- **Action:** visit `route('accounts.edit')`, fill "Full name" = `John Doe`, "Phone" = `5551234` (and "Country" when present), click "Complete profile".
- **Outcome contract:**
  - Post-action path: `route('clubs.create')` (`/clubs/create`) — a freshly-completed user has no club, so the home gate routes them onward to create one.
  - DB: `db.assertHas('users', { id: user.id, full_name: 'John Doe', phone: '5551234' })` (+ `country: 'Ghana'` for row 1).
- **Does NOT assert:** the `profile_completed_at` timestamp directly (proven behaviorally — landing on `clubs.create` rather than being bounced back to `accounts.edit` means the completeProfile gate passed).
- **Why:** `Accounts.update` stamps completion and redirects home; the home active-club gate then routes the no-club user to `clubs.create`.

### Test 9 — an existing completed user with no club opens a valid magic link and lands on create-a-club

- **Surface:** `Sessions.store` — `tests/browser/sessions/store.spec.ts` (rewrites existing "a valid link for an existing completed user signs in and lands on the dashboard")
- **Suite:** browser
- **Setup:** `const user = UserFactory.apply('completed').create()`; `const url = signedUrlFor('auth.verify', { email: user.email }, { expiresIn: '15 minutes' })`. Auth: none before visit.
- **Action:** `visit(url)`.
- **Outcome contract:**
  - Post-action path: `route('clubs.create')` (`/clubs/create`).
  - Authenticated: `page.getByRole('button', { name: 'Logout' })` visible.
  - DB: `db.assertCount('users', 1)` — no duplicate.
- **Does NOT assert:** dashboard content.
- **Why:** `Sessions.store` `firstOrCreate` (find) → login → `isProfileComplete` → redirect home → the active-club gate routes the no-club user to `clubs.create`.

### Test 10 — the role catalog contains the six defined roles

- **Surface:** roles seed / catalog — `tests/unit/roles/seed.spec.ts`
- **Suite:** unit
- **Setup:** `group.each.setup` → `truncate()` then `seedRoles()`.
- **Action:** query the `roles` table.
- **Outcome contract:**
  - DB: `db.assertCount('roles', 6)`; `db.assertHas('roles', { name: '<name>' })` for each of Administrator, Head Coach/Head Teacher, Teacher, Deck Supervisor, Parent, Student.
- **Does NOT assert:** the roles' permission contents (empty `'[]'` at this stage).
- **Why:** blueprint seed + memberships delta "role set is defined" — the six roles exist for assignment. (Verifies the shared `RoleName`-driven seed path is complete; the migration and helper both derive from `RoleName`.)

## Factories audit

Reads: testing.md

- `UserFactory` — **existing** (`database/factories/user_factory.ts`; default = incomplete, `completed` state). Used by: T1–T9 (`completed` for T1–T7, T9; default/incomplete for T8).
- `ClubFactory` — **new** (`database/factories/club_factory.ts`). Used by: T3, T4, T5, T6.
- No `MembershipFactory` — founding (T1) creates the membership under test; the active-club setups (T5, T6) only need `clubs` + `active_club_id`. No `RoleFactory` — roles come from `seedRoles()`.

## Fakes audit

Reads: testing.md

- **None.** No built-in fakes (no mail/event/hash/drive boundary in founding) and no container swaps — `ClubFoundingService` is own code exercised for real through the browser, never swapped.

## Order rationale

Reads: testing.md

- Journey order: found a club (T1–T5) → the home active-club gate (T6–T7) → the profile-completion landing (T8) → the magic-link login landing (T9); the order-independent roles unit test (T10) last.
- Every test self-seeds (factories + `seedRoles()` + `loginAs`), so no test depends on another's data.

## Runner-model risks

Reads: testing.md

- **Role-seed ordering.** `group.each.setup` for the founding group (T1–T5) and the roles group (T10) must run `truncate()` **then** `seedRoles()` — reversed, truncate wipes the freshly-seeded catalog and founding (`Role.findByOrFail('Administrator')`) throws. Mitigation: fixed truncate→seed order.
- **Migrate-seeded roles do not survive per-test truncate.** The seed migration runs once at `db().migrate()`; per-test truncate clears `roles`. Every founding/roles test re-establishes them via `seedRoles()` (above); home/accounts/sessions groups don't found and need no seed.
- Otherwise none — DB-count assertions (T2=0, T3=1, T4=2) rely on per-test `truncate()`; every test creates its own user, clubs, roles, and logs in fresh, so the suite is order-independent.

## Open questions

- The **create-club page heading copy** and the **club-creation success flash text** are **not asserted by any test** (T1 explicitly excludes the flash; no test asserts the create-page heading). The build may choose sensible copy without pinning — listed only so it is clear the tests do not lock them.

---
