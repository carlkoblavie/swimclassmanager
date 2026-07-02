---
planned: 2026-07-02
built: 2026-07-02
---

# Member Invitation — Implementation Plan

> Task type: greenfield
> Stack: AdonisJS + Inertia React
> Database: SQLite

## Summary

An Administrator or Head Coach invites a person by email with a role; the invitation is emailed with a token link that, on open, signs the invitee in (creating the account if new), joins them to the club with the role, and sets it as their active club. Builds the deferred permission-checking layer (permission key, role seeding, scope-membership authorize middleware, `<Guard>`).

## Pre-implementation requirements

- **`@adonisjs/bouncer`** — used by the `authorize` middleware (`E_AUTHORIZATION_FAILURE`, `AuthorizationResponse`). Installed transitively via `@adonisplus/permissions`; add it as a direct dependency for explicitness.
- **`@generated/permissions` generation** — the restored `<Guard>` imports `PermissionKey` from `@generated/permissions`, produced by the `indexPermissions` hook. It emitted nothing for club-roles' _empty_ catalog; with a non-empty catalog now it should generate during the Vite build. Ensure it is generated before the inertia typecheck; fall back to `hasAccess(userPermissions, key)` inline if generation lags.

## Out of scope

- **Pending-invitation management UI** (list / revoke) — no `InvitationsController.index`/`show`, no revoke; re-sending happens by re-inviting through the form.
- **Member management** — no `MembershipsController.index`/`update`/`destroy` (list members, change role, remove) — Journey C.
- **Inviting Students/children, co-Administrator invites, parent→child onboarding** — separate changes.
- **Membership removal / leaving a club** — not modeled; the accept idempotency assumes members are not later removed.

## Current shape

- **Magic-link pattern** (registration): `MagicLinkMail` (signed URL), `SessionsController.store` (`firstOrCreate` → `login` → redirect on profile state). The accept link reuses this shape but with a stored rotating token + membership creation.
- **Permission engine unconfigured for use:** `start/permissions.ts` is an empty `definePermissions({})`; `@adonisplus/permissions` is configured; `Membership` has `withRoles`, `Role` has `withPermissions`. club-roles removed the configure-generated `authorize` middleware and `<Guard>` (both assumed a global model).
- **Roles** are the seeded catalog (`RoleName`, `seedRoles` helper) with `permissions '[]'`. **Active club** (`active_club_id`, `activeClub` shared prop, `ActiveClubMiddleware`) scopes the invite.

## Target shape

A club dashboard shows an "Invite member" affordance to Administrators and Head Coaches only. They pick an email + role; an invitation is created (one live row per club+email, rotating token) and emailed. The invitee opens the token link — no login required — and is signed in, joined to the club with the role, and dropped into the club (new invitees complete their profile first). The permission engine gates the invite surface; roles carry the invite permission.

## Logical schema

Reads: models.md, model-relationships.md, migrations.md, schema-rules.md

```dbml
Table invitations {
  id           integer    [pk, increment]
  club_id      integer    [not null, ref: > clubs.id]   // onDelete cascade
  email        varchar    [not null, note: 'normalized; the invitee may have no account yet']
  role_id      integer    [not null, ref: > roles.id]   // onDelete restrict — roles are a permanent catalog
  token        varchar    [not null, unique, note: 'unguessable accept secret; rotated on every (re-)send']
  expires_at   timestamp  [not null, note: 'send/re-send time + 7 days']
  accepted_at  timestamp  [null, note: 'null = pending; set on accept']
  created_at   timestamp  [not null]
  updated_at   timestamp  [null]

  indexes {
    (club_id, email) [unique, name: 'invitations_club_email_unique']
  }
}
```

- **One invitation row per `(club_id, email)`.** Re-sending updates the same row (rotate `token`, replace `role_id`, reset `expires_at`, clear `accepted_at`). The active-member check runs before touching invitations.
- **`token` is the accept secret and the supersede mechanism.** The accept link carries only the token (no signed URL); rotating it on each (re-)send means prior links no longer resolve.
- **`expires_at` = (re-)send time + 7 days.** Checked at accept.
- **`accepted_at`** null = pending, set = accepted. Re-inviting an accepted-and-still-a-member email is caught by the active-member check.
- **`email` is a plain normalized string**, not a user FK. Normalized on input so per-club comparisons are consistent.
- **`role_id` is app-restricted** to the invitable roles (validation), not the DB. Cascade on club delete; `restrict` on role.

## Migrations + models

Reads: migrations.md, models.md

`node ace make:model Invitation --migration`

Migration files (ordered):

- `database/migrations/<ts>_create_invitations_table.ts` — the `invitations` table per Step 1 DBML: `club_id` FK → `clubs.id` `onDelete('CASCADE')`; `email` (`notNullable`); `role_id` FK → `roles.id` `onDelete('RESTRICT')`; `token` (`notNullable().unique()`); `expires_at` (`notNullable`); `accepted_at` (nullable); two timestamps; `unique(['club_id','email'])`.

_(The `assign_invitation_permissions` migration is defined under Authorization + segregation — it depends on the permission-key catalog.)_

Model files:

- `app/models/invitation.ts` (new) — `Invitation extends InvitationSchema`.
  - `@belongsTo(() => Club)` `club`
  - `@belongsTo(() => Role)` `role`
  - `get isExpired(): boolean` — `expiresAt < DateTime.now()`; read at accept.
  - `get isPending(): boolean` — `acceptedAt === null`; distinguishes pending from already-accepted at accept.
- `app/models/club.ts` (modified) — add `@hasMany(() => Invitation)` `invitations` (both-sides declaration; used for per-club checks).

`node ace migration:run` — regenerates `database/schema.ts` with `InvitationSchema`.

## Service design

Reads: controllers.md, services.md

Issuance stays inline in `InvitationsController.store` (framework/model one-liners; the "already a member" rejection is a validator rule). Only the transactional accept is extracted.

- `app/services/invitation_acceptance_service.ts` — `InvitationAcceptanceService`. `node ace make:service invitation_acceptance`
  - `accept(invitation: Invitation): Promise<User>` — in one transaction: `firstOrCreate` the user by `invitation.email` → `firstOrCreate` their membership in `invitation.club` → attach `invitation.role` to that membership (idempotent) → set the user's `activeClubId` to the club → stamp `invitation.acceptedAt` (if unset) → return the user.
    - **Idempotency invariant:** re-clicking an already-accepted link finds the existing user + membership → no duplicate membership, role attach is a no-op, active club re-set — supporting "already-accepted → sign in + land." (Role attach via the `withRoles` pivot is idempotent per `model-relationships.md`.)
    - **Atomicity:** user + membership + role + active-club + accepted-stamp bound to one transaction.
  - Does NOT: verify the token/expiry/pending state (the controller guards those via `isExpired`/`isPending`), log the user in (HTTP — controller), or flash/redirect. HTTP-agnostic.

## Validation

Reads: validation.md, vine/types/string.md, vine/types/enum.md

### Input validation

`node ace make:validator invitation`

```ts title="app/validators/invitation.ts"
import vine from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'
import db from '@adonisjs/lucid/services/db'
import { RoleName } from '#values/role'

// notAlreadyMember — rejects an email already belonging to an active member of the club
async function notAlreadyMember(value: unknown, _options: undefined, field: FieldContext) {
  if (typeof value !== 'string') return
  const clubId = field.meta.clubId as number
  const existing = await db
    .from('memberships')
    .join('users', 'users.id', 'memberships.user_id')
    .where('memberships.club_id', clubId)
    .where('users.email', value)
    .first()
  if (existing) {
    field.report('This person is already a member.', 'invitation.member', field)
  }
}

const notAlreadyMemberRule = vine.createRule(notAlreadyMember)

export const storeInvitationValidator = vine.withMetaData<{ clubId: number }>().create({
  email: vine.string().trim().normalizeEmail().email().maxLength(254).use(notAlreadyMemberRule()),
  role: vine.enum([
    RoleName.HEAD_COACH,
    RoleName.TEACHER,
    RoleName.DECK_SUPERVISOR,
    RoleName.PARENT,
  ]),
})
```

### Business rules

- **Valid email.** Vine default message (assert pins; the brief's "Enter a valid email address." is intent). `normalizeEmail` normalizes on input so member/pending comparisons match stored user emails.
- **Not already a member.** Owner: `notAlreadyMember` custom rule (`vine.createRule`), club-scoped via `field.meta.clubId`. Reports **"This person is already a member."** inline → `errors.email`. Controller passes `meta: { clubId: user.activeClubId }`. No global message provider.
- **Already-pending is NOT a validation rejection** — handled by the controller's `updateOrCreate` (re-send, supersede).
- **Role restricted** to Head Coach/Head Teacher, Teacher, Deck Supervisor, Parent via `vine.enum` (Administrator + Student unreachable).
- **Accept side needs no validator** — the token is a route param, resolved by lookup with `isExpired`/`isPending` guards.

## Authorization + segregation

Reads: authentication.md, authorization.md

Scope-membership model (authorization.md): the subject is the `Membership` in the user's active club.

- **Permission keys** — `start/permissions.ts` (modified from the empty stub):
  - `definePermissions({ invitation: { create: 'Invite members to the club' } })`; export `permissions` and `PermissionKey`.
  - Export `rolePermissions` map: `Administrator` + `Head Coach/Head Teacher` → `[permissions.getKey('invitation.create')]` (single source for role→permission seeding).
- **Role-permission seeding** (`node ace make:migration assign_invitation_permissions`):
  - `database/migrations/<ts>_assign_invitation_permissions.ts` — `this.defer` sets the two roles' `permissions` column from `rolePermissions` (via `permissions.getKey('invitation.create')`). Idempotent; runs after club-roles' `[]` seed.
  - `tests/helpers.ts` `seedRoles` (modified) — seed each role with `rolePermissions[name] ?? []` instead of `'[]'`, so truncate-and-reseed test runs carry the permissions. (Doesn't break club-roles tests — they assert role names, not permissions.)
- **Scope-membership authorize middleware** (`node ace make:middleware authorize --stack=named` — re-created; club-roles removed the configure default):
  - `app/middleware/authorize_middleware.ts` — resolve the current user's `Membership` in `user.activeClubId`; `permissions.createAccessFor(membership)`; throw `E_AUTHORIZATION_FAILURE` if no membership or `!access.allows(ability)`. Registered as `authorize` in `start/kernel.ts`.
  - **No policies, no bouncer initialize middleware** — a pure permission-key gate; `createAccessFor(...).allows(key)` called directly.
- **Access model:**
  - `invitations.create` / `invitations.store` — `auth` + `completeProfile` + `activeClub` + `authorize('invitation.create')`.
  - `MembershipsController.store` (accept) — **open** (no `auth`/`guest`): the token + `isExpired`/`isPending` guards are the gate; the controller authenticates as the invited email.
- **UI gating:** `userPermissions` shared prop (`inertia_middleware`) — the active-club membership's keys via `createAccessFor(membership).permissions()`, `inertia.once`, empty when no active-club membership. `<Guard>` restored (see Views).
- **Query segregation:**
  - `InvitationsController.store` — `clubId = auth.getUserOrFail().activeClubId`; member check (validator meta) and the invitation's `club_id` derive from the inviter's active club, never client input.
  - `MembershipsController.store` — the invitation is resolved by the URL **token**; club, role, email come from the invitation row.
  - `authorize` middleware resolves membership by `(activeClubId, current user)` — no client-supplied club/member id.

## Controllers

Reads: controllers.md, http-context.md, request.md, middleware.md, model-relationships.md

- `app/controllers/invitations_controller.ts` (new) — `InvitationsController`. `node ace make:controller invitations`
  - `create` — wiring: `inertia.render('invitations/create', { roles: <the four invitable role names> })`. Passes the picker options; backend `RoleName` values never imported into the frontend.
  - `store` — wiring: `auth.getUserOrFail()` → `request.validateUsing(storeInvitationValidator, { meta: { clubId: user.activeClubId } })` → `Role.findByOrFail('name', payload.role)` → `Invitation.updateOrCreate({ clubId: user.activeClubId, email: payload.email }, { roleId, token: <random>, expiresAt: now + '7 days', acceptedAt: null })` → load the active club for its name → `mail.sendLater(new InvitationMail(invitation.email, invitation.token, club.name, payload.role))` → `session.flash('success', 'Invitation sent to …')` → `response.redirect().toRoute('home')`.
    - **Ordering:** user → validate (meta `clubId`) → resolve role → `updateOrCreate` (rotated token supersedes prior links) → queue mail → flash → redirect.
    - **Supersede invariant:** token regenerated on every `store`; `updateOrCreate` on `(clubId, email)` refreshes the single row (new role, new 7-day expiry, `acceptedAt` reset to null).
    - No branch for already-member (validator rejects) or already-pending (`updateOrCreate` re-sends).
  - DI: none.
- `app/controllers/memberships_controller.ts` (new) — `MembershipsController`. `node ace make:controller memberships`
  - `store` — method-injected `InvitationAcceptanceService`. Wiring: `params.token` → `Invitation.query().where('token', token).preload('role').preload('club').first()` → guards → `invitationAcceptanceService.accept(invitation)` → `auth.use('web').login(user)` → `response.redirect().toRoute('home')`.
    - **Guard branch:** no invitation, **or** (`invitation.isPending && invitation.isExpired`) → `session.flash('error', 'This invitation has expired. Ask the person who invited you for a new one.')` → `response.redirect().toRoute('sign_in_links.create')` (mirrors the magic-link expired path).
    - An **already-accepted** (not-pending) invitation falls through to `accept` (idempotent) → sign in + land — satisfying "already-accepted → sign in."
    - **Landing via existing gates:** redirect to `home`; a brand-new invitee (no profile) is routed by `completeProfile` → `accounts.edit` first, a complete one by `activeClub` → the club dashboard (active club just set to the joined club).
    - **Non-default path:** accept delegated to `InvitationAcceptanceService`.
    - No authz call — the token is the authority (open route).
  - DI: method-level `@inject()` on `store`.

## Response layer

Reads: transformers.md, response.md, session.md, exception-handling.md

**No new transformer** — the invitation is never rendered to a page in this change.

- `invitations/create` — only prop is `roles: string[]` (the four invitable role names), passed directly by `InvitationsController.create` (plain array, no transformer).
- `MembershipsController.store` — redirects only; nothing rendered.
- **Shared prop:** `userPermissions: string[]` added to `inertia_middleware.share()` — active-club membership's keys via `createAccessFor(membership).permissions()`, wrapped in `ctx.inertia.once(...)` (empty array when no active-club membership). Plain array.
- **Flash + redirect:** `InvitationsController.store` → `session.flash('success', …)` + `redirect().toRoute('home')`. `MembershipsController.store` → success: `auth.login` + `redirect().toRoute('home')`; expired/invalid: `session.flash('error', …)` + `redirect().toRoute('sign_in_links.create')`.
- **Exceptions:** the `authorize` middleware throws `E_AUTHORIZATION_FAILURE` (`@adonisjs/bouncer`) for a non-inviter reaching an invite route directly — a recognized self-handled error that redirects back with a flashed error. No custom exception class.

## Routes

Reads: routing.md, middleware.md

```diff title="start/kernel.ts"
 export const middleware = router.named({
+  authorize: () => import('#middleware/authorize_middleware'),
   guest: () => import('#middleware/guest_middleware'),
   auth: () => import('#middleware/auth_middleware'),
   completeProfile: () => import('#middleware/complete_profile_middleware'),
   activeClub: () => import('#middleware/active_club_middleware'),
 })
```

```diff title="start/routes.ts"
 router
   .group(() => {
     router.get('clubs/create', [controllers.Clubs, 'create'])
     router.post('clubs', [controllers.Clubs, 'store'])
   })
   .use(middleware.auth())
   .use(middleware.completeProfile())
+
+router
+  .group(() => {
+    router.get('invitations/create', [controllers.Invitations, 'create'])
+    router.post('invitations', [controllers.Invitations, 'store'])
+  })
+  .use(middleware.auth())
+  .use(middleware.completeProfile())
+  .use(middleware.activeClub())
+  .use(middleware.authorize('invitation.create'))
+
+// Accept an invitation — open link, the token is the authority.
+// Static `invitations/create` (above) must precede this dynamic route.
+router.get('invitations/:token', [controllers.Memberships, 'store'])
```

- Invite routes: `auth → completeProfile → activeClub → authorize('invitation.create')`.
- Accept route (`memberships.store`, `GET /invitations/:token`): no middleware — reachable logged in or out; the `InvitationMail` builds its link from this route name + the token param.
- Static `invitations/create` registered before the dynamic `invitations/:token`.

Verify route names with `node ace list:routes`.

## Events + side effects

Reads: mail.md, url-builder.md

`node ace make:mail invitation`

- `app/mails/invitation_mail.ts` (new) — `InvitationMail extends BaseMail`.
  - Constructor takes primitives — `(email: string, token: string, clubName: string, roleName: string)` — avoiding preloaded-relation serialization across `sendLater`.
  - `prepare()`: `acceptUrl = urlFor('memberships.store', { token }, { prefixUrl: appUrl })` — a **plain** absolute route URL (not `signedUrlFor`; the token is the secret). `message.to(email)` + `htmlView('emails/invitation_html', { acceptUrl, clubName, roleName })` + `textView('emails/invitation_text', …)`. Subject e.g. `You've been invited to join ${clubName}`.
- `resources/views/emails/invitation_html.edge` (MJML) + `resources/views/emails/invitation_text.edge` (new) — mirror the magic-link templates.

No domain events, no listeners. The queued invitation email (`mail.sendLater` in `InvitationsController.store`) is the sole side effect.

## Views

Reads: frontend.md, transformers.md, design-system.md

- `inertia/pages/invitations/create.tsx` (new) — the invite form. `node ace make:page invitations/create`
  - Props: `InertiaProps<{ roles: string[] }>` — matches `InvitationsController.create`'s `roles` prop.
  - Layout: global default (no explicit `.layout`).
  - Form submit target: `InvitationsController.store` via `<Form route="invitations.store">` (POST).
  - Fields: `email` (text, label "Email", `errors.email` — invalid + already-a-member); `role` (`<select name="role">` with one `<option>` per `roles` entry, label "Role", `errors.role`). Submit "Send invitation" `disabled={processing}`. Mirror `.form-container` / `.button` / `data-invalid`.
  - Composes: none new — page-owned form JSX.
- `inertia/pages/home.tsx` (modified) — add `<Guard for="invitation.create"><Link route="invitations.create">Invite member</Link></Guard>` so only an Administrator/Head Coach of the active club sees it.
- `inertia/utils/permissions.tsx` (restored) — the `<Guard>` component club-roles removed. Reads the `userPermissions` shared prop and renders children when the key is held (`hasAccess` from `@adonisplus/permissions`; `PermissionKey` from `@generated/permissions`).
  - **Build note:** needs `@generated/permissions` generated (see Pre-implementation requirements); fallback to `hasAccess(userPermissions, 'invitation.create')` inline if generation lags.

No accept page — `MembershipsController.store` only redirects.

## Test coverage gap

No existing tests for invitations. New coverage required (plan owned by `assert.md`), all viable with the Japa browser client + `mail.fake()`:

- **Sending:** an Administrator (or Head Coach) invites an email + role → `InvitationMail` queued to that address, flash shown, invitation row created (pending, 7-day expiry). A non-inviter (Teacher/Parent, or no active-club membership) is denied the invite route. Invalid email → `errors.email`, no mail. Inviting an existing active member → "This person is already a member.", no mail. The role picker rejects Administrator/Student (enum) — unreachable via UI, so covered at the validator layer only if at all.
- **Re-send / supersede:** re-inviting a pending email → the row is refreshed (new token, new role, new expiry); the prior token no longer accepts.
- **Accepting:** a valid token for a new email → account created, signed in, member of the club with the role, active club set, lands appropriately (new invitee → complete-profile). A valid token for an existing completed user → signed in, joined, lands on the club. An expired (pending) token → "expired" message, no join. An already-accepted token re-opened → signed in, no duplicate membership.
- **Permission seeding:** Administrator + Head Coach carry `invitation.create`; Teacher/Deck Supervisor/Parent do not.
- **UI gating:** the "Invite member" affordance shows for an Administrator/Head Coach and is absent for other roles (`<Guard>` / `userPermissions`).

---
