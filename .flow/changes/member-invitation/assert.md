---
built: 2026-07-02
---

# Member Invitation — Test Plan

> Stack: AdonisJS + Inertia React
> Source: .flow/changes/member-invitation/blueprint.md
> Date: 2026-07-02

## Summary

Ten browser tests covering the invitation lifecycle: sending (inviter authz for Administrator + Head Coach, validation, already-a-member rejection, re-send refresh) and accepting (new-email create-and-join, existing-user join, expired link, already-accepted idempotency, superseded token). The permission engine is exercised functionally through the send-side authz tests.

## Pre-implementation requirements

- **`InvitationFactory`** — `database/factories/invitation_factory.ts`. Default pending (faker email, random `token`, `expiresAt` = now + 7 days, `acceptedAt` null); `club_id` + `role_id` via `.merge(...)`. States: `expired` (`expiresAt` past), `accepted` (`acceptedAt` set). Used by T5–T10.
- **`joinClub(user, club, roleName)` helper** — `tests/helpers.ts`. Creates a membership `(club, user)`, attaches the named role, sets the user's active club. Used by T1, T2, T4, T9.
- **`seedRoles` must seed role permissions** (blueprint Step 6) — Administrator + Head Coach carry `invitation.create`, others empty — so the send-side authz tests reflect real permissions. The existing helper is extended, not added.

## Coverage decisions

Reads: testing.md

> This is the scope inventory for this change — every behavior the change makes observable, with a coverage decision per row. It is not the test list.

| Observable behavior                                                                                         | Decision | Notes                                                                                                          |
| ----------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| Create-invite form renders with the role options                                                            | skip     | covered by store tests' navigation                                                                             |
| An inviter (Administrator/Head Coach) sends an invitation → InvitationMail queued to the email              | add      | —                                                                                                              |
| Sending shows the "invitation sent" confirmation                                                            | dedup    | → row 2                                                                                                        |
| Sending creates a pending invitation row                                                                    | dedup    | → row 2                                                                                                        |
| A member without invite permission is denied the invite route                                               | add      | —                                                                                                              |
| An invalid email is rejected and queues no mail                                                             | add      | —                                                                                                              |
| Inviting an existing active member shows "This person is already a member." and queues no mail              | add      | —                                                                                                              |
| Re-inviting a pending email refreshes the invitation and queues mail                                        | add      | —                                                                                                              |
| The role picker offers only the four invitable roles                                                        | skip     | enum-constrained; Administrator/Student unreachable via the picker                                             |
| A valid token for a new email creates the account, signs in, joins with the role, lands on complete-profile | add      | —                                                                                                              |
| A valid token for an existing completed user signs in, joins, and lands on the club dashboard               | add      | —                                                                                                              |
| An expired invitation link shows the expired message and does not join                                      | add      | —                                                                                                              |
| An already-accepted token re-opened signs in and creates no duplicate membership                            | add      | —                                                                                                              |
| A superseded (old) token after a re-send no longer accepts                                                  | add      | —                                                                                                              |
| The "Invite member" affordance shows for an inviter and is absent for a non-inviter                         | skip     | UI affordance; the route authz test is the security gate — Guard/userPermissions covered functionally          |
| Administrator + Head Coach carry `invitation.create`; other roles don't                                     | skip     | covered functionally by the inviter-allowed + non-inviter-denied tests                                         |
| A profile-complete user with an active club sees the dashboard                                              | keep     | browser/home/index.spec.ts:a profile-complete user with an active club sees the dashboard                      |
| A profile-complete user with no active club is redirected to create a club                                  | keep     | browser/home/index.spec.ts:a profile-complete user with no active club is redirected to create a club          |
| An authenticated user without a completed profile is redirected to complete-profile                         | keep     | browser/home/index.spec.ts:an authenticated user without a completed profile is redirected to complete-profile |

## Test list (ordered)

Reads: testing.md

1. T1 [browser] — an inviter sends an invitation, queuing the email and creating a pending invitation
2. T2 [browser] — a member without invite permission cannot reach the invite form
3. T3 [browser] — rejects an invalid email and queues no mail
4. T4 [browser] — rejects inviting an existing member and queues no mail
5. T5 [browser] — re-inviting a pending email refreshes the single invitation and queues mail
6. T6 [browser] — a valid token for a new email creates the account, joins with the role, and lands on complete-profile
7. T7 [browser] — a valid token for an existing completed user signs in, joins, and lands on the club dashboard
8. T8 [browser] — an expired invitation link shows the expired message and does not join
9. T9 [browser] — an already-accepted token re-opened signs in and creates no duplicate membership
10. T10 [browser] — a superseded (old) token after a re-send no longer accepts

## Per-test contracts

Reads: testing.md

Copy tokens:

- `MSG_INVITE_SENT` marker = "Invitation sent" (substring; exact flash copy is an open question).
- `MSG_ALREADY_MEMBER` = "This person is already a member."
- `MSG_INVITE_EXPIRED` = "This invitation has expired. Ask the person who invited you for a new one."
- `ERR_EMAIL` = "The email field must be a valid email address" (Vine default, registration precedent).

Fixed data: club `Aqua Swim Club` / `Accra`; invitee email `invitee@example.com`; invited role `Teacher`.

### Test 1 — an inviter sends an invitation, queuing the email and creating a pending invitation

- **Surface:** `InvitationsController.store` — `tests/browser/invitations/store.spec.ts`
- **Suite:** browser
- **Setup:**
  - Factories: `const inviter = await UserFactory.apply('completed').create()`; `const club = await ClubFactory.merge({ createdByUserId: inviter.id }).create()`.
  - Other: `seedRoles()`; `await joinClub(inviter, club, row.inviterRole)` (sets active club).
  - Fakes: `using fake = mail.fake()`.
  - Auth: `browserContext.loginAs(inviter)`.
  - Parameterized rows: `{ inviterRole: RoleName.ADMINISTRATOR }`, `{ inviterRole: RoleName.HEAD_COACH }`.
- **Action:** visit `route('invitations.create')`, fill "Email" = `invitee@example.com`, select "Role" = `Teacher`, click "Send invitation".
- **Outcome contract:**
  - Post-action path: `route('home')`.
  - Rendered DOM: `assertVisible('text=Invitation sent')`.
  - Fake: `fake.mails.assertQueued(InvitationMail, (m) => m.message.hasTo('invitee@example.com'))`.
  - DB: `db.assertHas('invitations', { club_id: club.id, email: 'invitee@example.com', accepted_at: null })`.
- **Does NOT assert:** the token value; the exact expiry timestamp.
- **Why:** `InvitationsController.store` queues `InvitationMail` + creates a pending invitation; both Administrator and Head Coach carry `invitation.create`.

### Test 2 — a member without invite permission cannot reach the invite form

- **Surface:** `InvitationsController` authorize gate (create route) — `tests/browser/invitations/store.spec.ts`
- **Suite:** browser
- **Setup:** `const member = await UserFactory.apply('completed').create()`; `const club = await ClubFactory.merge({ createdByUserId: member.id }).create()`; `seedRoles()`; `await joinClub(member, club, RoleName.PARENT)`; `using fake = mail.fake()`; `loginAs(member)`.
- **Action:** visit `route('invitations.create')`.
- **Outcome contract:**
  - Rendered DOM: `assertNotExists(page.getByRole('button', { name: 'Send invitation' }))`.
  - Fake: `fake.mails.assertNoneQueued()`.
- **Does NOT assert:** the exact redirect landing path.
- **Why:** `authorize('invitation.create')` denies a member whose role lacks the permission.

### Test 3 — rejects an invalid email and queues no mail

- **Surface:** `InvitationsController.store` — `tests/browser/invitations/store.spec.ts`
- **Suite:** browser
- **Setup:** inviter (Administrator): `UserFactory` + `ClubFactory` (`createdByUserId` = inviter) + `joinClub(inviter, club, RoleName.ADMINISTRATOR)`; `seedRoles()`; `using fake = mail.fake()`; `loginAs(inviter)`.
- **Action:** visit `route('invitations.create')`, fill "Email" = `not-an-email`, select "Role" = `Teacher`, click "Send invitation".
- **Outcome contract:**
  - Post-action path: `route('invitations.create')`.
  - Rendered DOM: `assertVisible('text=<ERR_EMAIL>')`.
  - Fake: `fake.mails.assertNoneQueued()`. DB: `db.assertCount('invitations', 0)`.
- **Does NOT assert:** the role field state.
- **Why:** the validator's email rule fails → nothing queued.

### Test 4 — rejects inviting an existing member and queues no mail

- **Surface:** `InvitationsController.store` — `tests/browser/invitations/store.spec.ts`
- **Suite:** browser
- **Setup:** inviter (Administrator) as T3; plus `const member = await UserFactory.create()`; `await joinClub(member, club, RoleName.PARENT)`; `using fake = mail.fake()`; `loginAs(inviter)`.
- **Action:** visit `route('invitations.create')`, fill "Email" = `member.email`, select "Role" = `Teacher`, click "Send invitation".
- **Outcome contract:**
  - Post-action path: `route('invitations.create')`.
  - Rendered DOM: `assertVisible('text=<MSG_ALREADY_MEMBER>')`.
  - Fake: `fake.mails.assertNoneQueued()`. DB: `db.assertCount('invitations', 0)`.
- **Does NOT assert:** the member's membership details.
- **Why:** the `notAlreadyMember` custom rule rejects.

### Test 5 — re-inviting a pending email refreshes the single invitation and queues mail

- **Surface:** `InvitationsController.store` — `tests/browser/invitations/store.spec.ts`
- **Suite:** browser
- **Setup:** inviter (Administrator) as T3; `seedRoles()`; `const teacher = await Role.findByOrFail('name', RoleName.TEACHER)`; `const parent = await Role.findByOrFail('name', RoleName.PARENT)`; `await InvitationFactory.merge({ clubId: club.id, roleId: teacher.id, email: 'invitee@example.com' }).create()`; `using fake = mail.fake()`; `loginAs(inviter)`.
- **Action:** visit `route('invitations.create')`, fill "Email" = `invitee@example.com`, select "Role" = `Parent`, click "Send invitation".
- **Outcome contract:**
  - Post-action path: `route('home')`.
  - Fake: `fake.mails.assertQueued(InvitationMail, (m) => m.message.hasTo('invitee@example.com'))`.
  - DB: `db.assertCount('invitations', 1)`; `db.assertHas('invitations', { club_id: club.id, email: 'invitee@example.com', role_id: parent.id })`.
- **Does NOT assert:** the token value directly (supersede-on-accept is T10).
- **Why:** `updateOrCreate` on `(club, email)` refreshes the single invitation with the latest role and re-queues mail.

### Test 6 — a valid token for a new email creates the account, joins with the role, and lands on complete-profile

- **Surface:** `MembershipsController.store` — `tests/browser/memberships/store.spec.ts`
- **Suite:** browser
- **Setup:** `const founder = await UserFactory.create()`; `const club = await ClubFactory.merge({ createdByUserId: founder.id }).create()`; `seedRoles()`; `const teacher = await Role.findByOrFail('name', RoleName.TEACHER)`; `const invitation = await InvitationFactory.merge({ clubId: club.id, roleId: teacher.id, email: 'invitee@example.com' }).create()`. Auth: none before visit.
- **Action:** `visit(route('memberships.store', { token: invitation.token }))`.
- **Outcome contract:**
  - Post-action path: `route('accounts.edit')`.
  - DB: `db.assertHas('users', { email: 'invitee@example.com' })`; the new user's membership in the club carries the Teacher role (`memberships` joined through `membership_roles` to `roles.name = 'Teacher'`); the new user's `active_club_id = club.id`.
  - Authenticated: `assertExists(page.getByRole('button', { name: 'Logout' }))`.
- **Does NOT assert:** profile field values (none yet).
- **Why:** `MembershipsController.store` → `InvitationAcceptanceService.accept` (create user + membership + role + active club) → login → home → completeProfile gate.

### Test 7 — a valid token for an existing completed user signs in, joins, and lands on the club dashboard

- **Surface:** `MembershipsController.store` — `tests/browser/memberships/store.spec.ts`
- **Suite:** browser
- **Setup:** `const founder = await UserFactory.create()`; `const club = await ClubFactory.merge({ createdByUserId: founder.id, name: 'Aqua Swim Club', location: 'Accra' }).create()`; `const invitee = await UserFactory.apply('completed').create()`; `seedRoles()`; teacher role; `const invitation = await InvitationFactory.merge({ clubId: club.id, roleId: teacher.id, email: invitee.email }).create()`. Auth: none before visit.
- **Action:** `visit(route('memberships.store', { token: invitation.token }))`.
- **Outcome contract:**
  - Post-action path: `route('home')`.
  - Rendered DOM: `assertVisible('text=Aqua Swim Club')`.
  - DB: the invitee's membership in the club with the Teacher role; `invitee.active_club_id = club.id`.
  - Authenticated: `Logout` visible.
- **Does NOT assert:** the invitee's profile (already complete).
- **Why:** accept for a profile-complete user → joined, active club set, lands on home showing the club.

### Test 8 — an expired invitation link shows the expired message and does not join

- **Surface:** `MembershipsController.store` — `tests/browser/memberships/store.spec.ts`
- **Suite:** browser
- **Setup:** founder + club; `seedRoles()`; teacher role; `const invitation = await InvitationFactory.apply('expired').merge({ clubId: club.id, roleId: teacher.id, email: 'ghost@example.com' }).create()`. Auth: none.
- **Action:** `visit(route('memberships.store', { token: invitation.token }))`.
- **Outcome contract:**
  - Post-action path: `route('sign_in_links.create')`.
  - Rendered DOM: `assertVisible('text=<MSG_INVITE_EXPIRED>')`.
  - DB: `db.assertMissing('users', { email: 'ghost@example.com' })`; `db.assertCount('memberships', 0)`.
  - Not authenticated: `assertNotExists(page.getByRole('button', { name: 'Logout' }))`.
- **Does NOT assert:** the expired-vs-superseded distinction.
- **Why:** the `isPending && isExpired` guard blocks the accept → error flash + redirect, no join.

### Test 9 — an already-accepted token re-opened signs in and creates no duplicate membership

- **Surface:** `MembershipsController.store` — `tests/browser/memberships/store.spec.ts`
- **Suite:** browser
- **Setup:** `const invitee = await UserFactory.apply('completed').create()`; `const founder = await UserFactory.create()`; `const club = await ClubFactory.merge({ createdByUserId: founder.id }).create()`; `seedRoles()`; `const teacher = await Role.findByOrFail('name', RoleName.TEACHER)`; `await joinClub(invitee, club, RoleName.TEACHER)`; `const invitation = await InvitationFactory.apply('accepted').merge({ clubId: club.id, roleId: teacher.id, email: invitee.email }).create()`. Auth: none.
- **Action:** `visit(route('memberships.store', { token: invitation.token }))`.
- **Outcome contract:**
  - Post-action path: `route('home')`.
  - DB: `db.assertCount('memberships', 1)` (only the invitee's — no duplicate).
  - Authenticated: `Logout` visible.
- **Does NOT assert:** role re-attachment internals.
- **Why:** `accept` is idempotent — an already-accepted invitation finds the existing membership, creates no duplicate, signs in.

### Test 10 — a superseded (old) token after a re-send no longer accepts

- **Surface:** `MembershipsController.store` — `tests/browser/memberships/store.spec.ts`
- **Suite:** browser
- **Setup:** founder + club; `seedRoles()`; teacher role; `const invitation = await InvitationFactory.merge({ clubId: club.id, roleId: teacher.id, email: 'invitee@example.com' }).create()`; capture `const oldToken = invitation.token`; then rotate: `invitation.token = <new random>; await invitation.save()`. Auth: none.
- **Action:** `visit(route('memberships.store', { token: oldToken }))`.
- **Outcome contract:**
  - Post-action path: `route('sign_in_links.create')`.
  - Rendered DOM: `assertVisible('text=<MSG_INVITE_EXPIRED>')`.
  - DB: `db.assertMissing('users', { email: 'invitee@example.com' })`; `db.assertCount('memberships', 0)`.
- **Does NOT assert:** the new token's validity (the send-side refresh is T5).
- **Why:** the rotated-away old token resolves to no invitation → the not-found guard → expired message, no join.

## Factories audit

Reads: testing.md

- `UserFactory` — **existing** (`completed` state). Used by: T1–T10.
- `ClubFactory` — **existing**. Used by: T1–T10.
- `InvitationFactory` — **new** (`expired`, `accepted` states). Used by: T5, T6, T7, T8, T9, T10.
- No membership factory — the `joinClub` helper sets up memberships (T1, T2, T4, T9). Roles come from `seedRoles`, resolved by name in setup.

## Fakes audit

Reads: testing.md

- `mail.fake()` — built-in. Used by: T1–T5 (`fake.mails.assertQueued` / `assertNoneQueued`). T6–T10 send no mail.
- No container swaps — `InvitationAcceptanceService` is own code exercised through the browser; the only faked boundary is the mail provider.

## Order rationale

Reads: testing.md

- Lifecycle order: send (T1–T5) → accept (T6–T10). Accept tests self-seed their own invitations, so they do not depend on the send tests.
- Every test self-seeds (users, club, `joinClub`, `seedRoles`, `InvitationFactory`) and logs in / visits fresh — no cross-test data dependency.

## Runner-model risks

Reads: testing.md

- **Truncate → `seedRoles` ordering (both groups).** `group.each.setup` must capture the `truncate()` teardown, run `seedRoles()` (which now also seeds role permissions) in setup, and `return` the teardown — reversed, truncate wipes the catalog and the authz gate + role lookups break. Mitigation: fixed truncate→seed order; the `seedRoles` permission-seeding update is a build dependency.
- **Accept tests skip `loginAs`** — T6–T10 visit the token link unauthenticated (the link authenticates) and assert `Logout` after; correct.
- Otherwise none — order-independent, self-seeding; `db.assertCount` relies on per-test truncate; `mail.fake()` via `using` in the test body.

## Open questions

- The **invite success-flash exact copy** is not pinned (T1 asserts the substring "Invitation sent"). The build may finalize the wording (e.g. "Invitation sent to `<email>`.") without breaking the assertion.

---
