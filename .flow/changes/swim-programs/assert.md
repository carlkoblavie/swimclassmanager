---
built: 2026-07-03
---

# Swim Programs — Test Plan

> Stack: AdonisJS + Inertia React
> Source: .flow/changes/swim-programs/blueprint.md
> Date: 2026-07-03

## Summary

Browser tests for the shared swim-program catalog: creating a program with nested levels (cedis → minor-units), the ≥1-level and case-insensitive-unique-name rules, level reconcile on edit, cascade delete, and — the crux — each club's per-level fee/availability being independent of every other club's. Authorization: all members view, only Administrator/Head Coach manage.

## Pre-implementation requirements

- **`ClubFactory` `slug` default** — `database/factories/club_factory.ts`. `clubs.slug` is `NOT NULL` and the factory sets no slug; add a unique slug default so `ClubFactory.create()` stops violating the constraint (outstanding since register-learner).
- **`ProgramFactory`** (new) — `database/factories/program_factory.ts`. Fields: unique `name`, `description`; relation `levels`.
- **`LevelFactory`** (new) — `database/factories/level_factory.ts`. Fields: `name`, `ageGroup`, `description`, `defaultFee` (minor units), `capacity`.
- **`ClubLevelSettingFactory`** (new) — `database/factories/club_level_setting_factory.ts`. Belongs to a club + level; fields `fee`, `available`.

## Coverage decisions

Reads: testing.md

> This is the scope inventory for this change — every behavior the change makes observable, with a coverage decision per row. It is not the test list.

| Observable behavior | Decision | Notes |
| --- | --- | --- |
| Programs list shows each program with its levels (name, age group, description, capacity) and each level's fee as "GHS X.XX" | add | — |
| An empty catalog shows a "no programs yet" message | add | — |
| Creating a program with 1+ levels persists it and its levels (fee stored as minor units) and lands on the list with a confirmation | add | — |
| Creating with a duplicate program name (case-insensitive) is rejected and nothing is created | add | — |
| Creating a program with no level is rejected | add | — |
| Creating with a missing required field, a negative fee, or a non-positive/non-whole capacity is rejected | add | — |
| The edit form is prefilled with the program and its levels (fee shown in cedis) | add | — |
| Editing a program updates its name/description and an existing level | add | — |
| Editing adds a new level to a program | add | — |
| Editing removes a level from a program | add | — |
| Editing to leave a program with zero levels is rejected | add | — |
| Renaming a program to an existing name (case-insensitive) is rejected | add | — |
| Removing a program deletes it, its levels, and its club settings, with a confirmation | add | — |
| Setting a club's fee override changes that club's fee only; another club still sees the default | add | — |
| Turning a level's availability off applies to that club only; another club still sees it available | add | — |
| Clearing a club's fee override restores the platform default | add | — |
| A non-manager member does not see the create/edit/remove/settings controls | add | — |
| A non-manager visiting a manage route is denied | add | — |
| A non-manager submitting a manage action (store/update/destroy/settings) is blocked | skip | unreachable via UI — controls hidden + routes gated; covered by the manage-route-denied row |

## Test list (ordered)

Reads: testing.md

1. T1 [browser] — creates a program with levels and lands on the list
2. T2 [browser] — rejects a duplicate program name (case-insensitive) and creates nothing
3. T3 [browser] — rejects a program with no level
4. T4 [browser] — rejects an invalid submission ({case})
5. T5 [browser] — lists programs with their levels and each level's fee
6. T6 [browser] — shows an empty-catalog message
7. T7 [browser] — a level's fee and availability reflect the viewing club, not another club's settings
8. T8 [browser] — edit form is prefilled with the program and its levels
9. T9 [browser] — edits a program's name/description and an existing level
10. T10 [browser] — adds a level to a program
11. T11 [browser] — removes a level from a program
12. T12 [browser] — rejects leaving a program with zero levels
13. T13 [browser] — rejects renaming to an existing program name (case-insensitive)
14. T14 [browser] — removes a program with its levels and club settings
15. T15 [browser] — setting a club's fee override updates that club's displayed fee
16. T16 [browser] — turning a level's availability off updates that club's display
17. T17 [browser] — clearing a fee override restores the default
18. T18 [browser] — a non-manager member does not see the manage controls
19. T19 [browser] — a non-manager is denied a manage route ({route})

## Per-test contracts

Reads: testing.md

Shared manager setup (unless noted): `group.each.setup` truncates the DB then runs `seedRoles()`; a `UserFactory.apply('completed')` user is joined to a `ClubFactory` club as `Administrator` via `joinClub`, then `browserContext.loginAs(user)` before the first visit. "Manager" = Administrator or Head Coach (both hold `program.manage`). Adding/editing a level is driven through the **Add/Edit level pop up** (fill → confirm) before submitting the program form.

### Test 1 — creates a program with levels and lands on the list
- **Surface:** ProgramsController.store
- **Suite:** browser
- **Setup:** Factories: UserFactory('completed'), ClubFactory. Auth: manager (Administrator), loginAs. Other: seedRoles.
- **Action:** visit `programs.create`; fill name "Learn to Swim" + description; open the Add level pop up and fill name "Beginners", age group "4-7", description, fee "50", capacity "10", confirm; submit the program form.
- **Outcome contract:**
  - Post-action URL: `programs.index`.
  - Rendered DOM: a success confirmation is visible; "Learn to Swim" is visible.
  - DB: `db.assertHas('programs', { name: 'Learn to Swim' })`; `db.assertHas('levels', { name: 'Beginners', default_fee: 5000, capacity: 10 })`.
- **Does NOT assert:** per-club fee/availability; the edit path.
- **Why:** locks create + nested-level persistence + the cedis→minor-units conversion (50 → 5000).

### Test 2 — rejects a duplicate program name (case-insensitive) and creates nothing
- **Surface:** ProgramsController.store
- **Suite:** browser
- **Setup:** manager; an existing `ProgramFactory` program named "Learn to Swim".
- **Action:** visit `programs.create`; fill name "learn to swim" + description + one valid level via the pop up; submit.
- **Outcome contract:**
  - Post-action URL: stays on `programs.create`.
  - Rendered DOM: the duplicate-name error is visible ("A program with this name already exists").
  - DB: `db.assertCount('programs', 1)`.
- **Does NOT assert:** the level rows.
- **Why:** case-insensitive unique program name (validator `unique` with `caseInsensitive`).

### Test 3 — rejects a program with no level
- **Surface:** ProgramsController.store
- **Suite:** browser
- **Setup:** manager.
- **Action:** visit `programs.create`; fill name + description; add no level (summary empty); submit.
- **Outcome contract:**
  - Post-action URL: stays on `programs.create`.
  - Rendered DOM: the "at least one level" message is visible ("A program must have at least one level").
  - DB: `db.assertCount('programs', 0)`.
- **Does NOT assert:** individual field errors.
- **Why:** `levels` `minLength(1)` rule; requires the summary to be emptiable (contract).

### Test 4 — rejects an invalid submission ({case})
- **Surface:** ProgramsController.store
- **Suite:** browser
- **Setup:** manager. Parameterized rows: `{ case: 'missing program name' }`, `{ case: 'negative fee' }`, `{ case: 'non-whole capacity' }`.
- **Action:** visit `programs.create`; fill everything validly except the row's invalid input — leave the program name blank / add a level with fee "-5" / add a level with capacity "1.5" (the pop up gates presence only, so the value reaches the server); submit.
- **Outcome contract:**
  - Post-action URL: stays on `programs.create`.
  - Rendered DOM: the matching validation error is visible (name required / fee must be ≥ 0 / capacity must be a positive whole number — exact copy is the vine default for the rule).
  - DB: `db.assertCount('programs', 0)`.
- **Does NOT assert:** the other cases' messages.
- **Why:** server value rules — name required, `fee` `min(0)`, `capacity` `withoutDecimals().positive()`.

### Test 5 — lists programs with their levels and each level's fee
- **Surface:** ProgramsController.index
- **Suite:** browser
- **Setup:** manager (any member suffices); a `ProgramFactory` "Learn to Swim" with a `LevelFactory` "Beginners" (`default_fee` 5000, `capacity` 10), no club settings.
- **Action:** visit `programs.index`.
- **Outcome contract:**
  - Rendered DOM: "Learn to Swim", "Beginners", age group, capacity "10", and fee "GHS 50.00" are visible.
- **Does NOT assert:** manage controls; per-club overrides.
- **Why:** index render + default-fee formatting (minor units → "GHS 50.00").

### Test 6 — shows an empty-catalog message
- **Surface:** ProgramsController.index
- **Suite:** browser
- **Setup:** a member (any role) with an active club; no programs.
- **Action:** visit `programs.index`.
- **Outcome contract:**
  - Rendered DOM: the empty-state message is visible ("No programs yet").
- **Does NOT assert:** anything program-specific.
- **Why:** empty-catalog branch.

### Test 7 — a level's fee and availability reflect the viewing club, not another club's settings
- **Surface:** ProgramsController.index
- **Suite:** browser
- **Setup:** two clubs A and B; a program with a level (`default_fee` 5000); a `ClubLevelSettingFactory` row for **club A** (`fee` 4000, `available` false). `userB` is a member of **club B** (joinClub, any role, active club B); loginAs userB.
- **Action:** visit `programs.index` as userB.
- **Outcome contract:**
  - Rendered DOM: the level shows "GHS 50.00" (the default, not 40) and appears available (not the off state).
- **Does NOT assert:** club A's view.
- **Why:** per-club resolution — the index preloads only the viewing club's `club_level_settings`; another club's override must not leak.

### Test 8 — edit form is prefilled with the program and its levels
- **Surface:** ProgramsController.edit
- **Suite:** browser
- **Setup:** manager; a program "Learn to Swim" + level "Beginners" (`default_fee` 5000).
- **Action:** visit `programs.edit` for the program.
- **Outcome contract:**
  - Rendered DOM: name "Learn to Swim" and description are present in the form; the level "Beginners" appears with its fee shown as "50" (cedis).
- **Does NOT assert:** submitting.
- **Why:** `forEdit` transformer variant emits `default_fee` back in cedis for prefill.

### Test 9 — edits a program's name/description and an existing level
- **Surface:** ProgramsController.update
- **Suite:** browser
- **Setup:** manager; program "Learn to Swim" + level "Beginners" (`default_fee` 5000).
- **Action:** visit `programs.edit`; change name to "Learn to Swim (Kids)"; edit the level (pop up) fee to "60"; submit.
- **Outcome contract:**
  - Post-action URL: `programs.index`; a confirmation is visible.
  - DB: `db.assertHas('programs', { name: 'Learn to Swim (Kids)' })`; `db.assertHas('levels', { default_fee: 6000 })`.
- **Does NOT assert:** add/remove of levels.
- **Why:** update + reconcile of an existing level (matched by id).

### Test 10 — adds a level to a program
- **Surface:** ProgramsController.update
- **Suite:** browser
- **Setup:** manager; program with one level "Beginners".
- **Action:** visit `programs.edit`; open the Add level pop up, fill "Intermediate" (fee "70", capacity "8"), confirm; submit.
- **Outcome contract:**
  - Post-action URL: `programs.index`.
  - DB: `db.assertHas('levels', { name: 'Intermediate', default_fee: 7000 })`; the program now has two `levels` rows.
- **Does NOT assert:** the existing level's fields.
- **Why:** reconcile — a level without an id is created.

### Test 11 — removes a level from a program
- **Surface:** ProgramsController.update
- **Suite:** browser
- **Setup:** manager; program with two levels "Beginners" and "Intermediate".
- **Action:** visit `programs.edit`; remove "Intermediate" from the summary; submit.
- **Outcome contract:**
  - Post-action URL: `programs.index`.
  - DB: `db.assertMissing('levels', { name: 'Intermediate' })`; `db.assertHas('levels', { name: 'Beginners' })`.
- **Does NOT assert:** program fields.
- **Why:** reconcile — an existing level absent from the payload is deleted.

### Test 12 — rejects leaving a program with zero levels
- **Surface:** ProgramsController.update
- **Suite:** browser
- **Setup:** manager; program with one level "Beginners".
- **Action:** visit `programs.edit`; remove the only level from the summary; submit.
- **Outcome contract:**
  - Post-action URL: stays on `programs.edit`.
  - Rendered DOM: the "at least one level" message is visible.
  - DB: `db.assertHas('levels', { name: 'Beginners' })` (unchanged).
- **Does NOT assert:** program field changes.
- **Why:** ≥1-level invariant enforced on update.

### Test 13 — rejects renaming to an existing program name (case-insensitive)
- **Surface:** ProgramsController.update
- **Suite:** browser
- **Setup:** manager; two programs "Learn to Swim" (with a level) and "Adult Lessons".
- **Action:** visit `programs.edit` for "Learn to Swim"; rename to "adult lessons"; submit.
- **Outcome contract:**
  - Post-action URL: stays on `programs.edit`.
  - Rendered DOM: the duplicate-name error is visible.
  - DB: `db.assertHas('programs', { name: 'Learn to Swim' })` (unchanged).
- **Does NOT assert:** level rows.
- **Why:** unique-name rule with self excluded via `meta.programId`.

### Test 14 — removes a program with its levels and club settings
- **Surface:** ProgramsController.destroy
- **Suite:** browser
- **Setup:** manager; program + level; a `ClubLevelSettingFactory` row for the manager's club on that level.
- **Action:** visit `programs.index`; trigger remove for the program (confirm if prompted).
- **Outcome contract:**
  - Post-action URL: `programs.index`; a confirmation is visible.
  - DB: `db.assertMissing('programs', { id })`; `db.assertCount('levels', 0)`; `db.assertCount('club_level_settings', 0)`.
- **Does NOT assert:** other programs.
- **Why:** destroy cascades to levels and their club settings.

### Test 15 — setting a club's fee override updates that club's displayed fee
- **Surface:** LevelSettingsController.update
- **Suite:** browser
- **Setup:** manager (Administrator of club A); program + level (`default_fee` 5000), no existing setting.
- **Action:** visit `programs.index`; in the level's settings control, set the club fee to "40"; submit.
- **Outcome contract:**
  - Rendered DOM (after landing back on `programs.index`): the level shows "GHS 40.00".
  - DB: `db.assertHas('club_level_settings', { club_id: <A>, level_id: <level>, fee: 4000 })`.
- **Does NOT assert:** another club's view; availability.
- **Why:** `level_settings.update` upserts the active club's fee override (cedis → minor units).

### Test 16 — turning a level's availability off updates that club's display
- **Surface:** LevelSettingsController.update
- **Suite:** browser
- **Setup:** manager (club A); program + level.
- **Action:** visit `programs.index`; in the level's settings control, turn availability off; submit.
- **Outcome contract:**
  - Rendered DOM: the level shows as unavailable for this club.
  - DB: `db.assertHas('club_level_settings', { club_id: <A>, level_id: <level>, available: false })`.
- **Does NOT assert:** fee; another club.
- **Why:** `level_settings.update` sets the active club's availability.

### Test 17 — clearing a fee override restores the default
- **Surface:** LevelSettingsController.update
- **Suite:** browser
- **Setup:** manager (club A); program + level (`default_fee` 5000); an existing `ClubLevelSettingFactory` row for club A with `fee` 4000.
- **Action:** visit `programs.index`; in the level's settings control, clear the fee (leave it empty); submit.
- **Outcome contract:**
  - Rendered DOM: the level shows "GHS 50.00" again.
  - DB: `db.assertHas('club_level_settings', { club_id: <A>, level_id: <level>, fee: null })`.
- **Does NOT assert:** availability.
- **Why:** a null fee clears the override; display falls back to the level default.

### Test 18 — a non-manager member does not see the manage controls
- **Surface:** ProgramsController.index (Guard)
- **Suite:** browser
- **Setup:** a `Parent` member of a club (joinClub, active club); a seeded program with a level.
- **Action:** visit `programs.index`.
- **Outcome contract:**
  - Rendered DOM: the "Create program" control is not present (`assertNotExists`/`assertNotVisible`); no edit/remove/settings controls are shown.
- **Does NOT assert:** route-level denial.
- **Why:** `<Guard for="program.manage">` hides management affordances from non-managers.

### Test 19 — a non-manager is denied a manage route ({route})
- **Surface:** ProgramsController.create / .edit (authorize middleware)
- **Suite:** browser
- **Setup:** a `Parent` member of a club; for the `edit` row, a seeded program. Parameterized rows: `{ route: 'programs.create' }`, `{ route: 'programs.edit' }`.
- **Action:** visit the parameterized manage route (GET).
- **Outcome contract:**
  - Post-action URL: not the manage page (redirected away — `assertPath` is not the create/edit path).
  - Rendered DOM: the program create/edit form is not shown.
- **Does NOT assert:** POST/PATCH/DELETE denials (unreachable via UI).
- **Why:** `middleware.authorize('program.manage')` gates the manage routes.

## Factories audit

Reads: testing.md

| Test | Factory | Existing / New |
| --- | --- | --- |
| All | UserFactory, ClubFactory | existing (ClubFactory needs a `slug` default — see Pre-implementation requirements) |
| T2, T5, T7, T8–T14, T18, T19 | ProgramFactory | new |
| T5, T7, T8–T14 | LevelFactory | new |
| T7, T14, T17 | ClubLevelSettingFactory | new |

Helpers (existing): `seedRoles` (grants `program.manage` via `rolePermissions`), `joinClub` (membership + role + active club).

## Fakes audit

Reads: testing.md

None. This change sends no mail, emits no events, and wraps no external IO — no built-in fakes and no container swaps are used.

## Order rationale

- The `store` happy path (T1) leads: it is the thinnest slice that builds the models, service, validator, and create surface end to end; every later read/edit test depends on that machinery.
- The two-club isolation test (T7) sits with the index surface because its observable outcome is what the *viewing* club renders; it seeds the other club's override via a factory rather than a second session.

## Runner-model risks

Reads: testing.md

None identified. Tests run sequentially in one process; `group.each.setup` truncates and re-seeds roles per test; each test creates its own factories (including both clubs in the isolation test), so no state leaks across tests and no test depends on another's order. No time-dependent behavior, so no `freezeTime` is required.
