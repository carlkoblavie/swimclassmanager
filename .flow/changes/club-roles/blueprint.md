---
planned: 2026-07-01
built: 2026-07-01
---

# Club Roles — Implementation Plan

> Task type: greenfield
> Stack: AdonisJS + Inertia React
> Database: SQLite

## Summary

A signed-in, profile-complete user creates a club (name + location) and becomes its Administrator; the club's role catalog is defined for later assignment. Introduces `clubs`, `memberships` (the scope-membership authorization subject), a global `roles` catalog, and an active-club context persisted on the user. Founding is transactional; a home-level gate routes no-club users into club creation.

## Pre-implementation requirements

- `node ace configure @adonisplus/permissions` — registers the package provider so the `withRoles` / `withPermissions` mixins resolve at runtime. May also scaffold `start/permissions.ts` and the inertia `<Guard>` util; both are left unpopulated/unused here (the permission-checking layer is deferred — see Out of scope).

## Out of scope

- **Permission-key catalog, bouncer middleware, policies, `<Guard>`, `userPermissions` shared prop** — the checking layer; deferred to member-invitation. Roles are granted, never checked, in this change.
- **Member invitation + assigning any role beyond the founder's Administrator** — its own change (Journey B).
- **Head Coach / Teacher / Deck Supervisor / Parent / Student assignment** — later, once invitation exists.
- **Classes, billing, attendance, swimmer portal** — later changes.
- **Dedicated `/clubs/:id` dashboard, `ClubsController.show` / `index`, club-switcher UI** — home is the active-club dashboard; switching later just updates `active_club_id`.
- **Active club in the nav/header** — `layouts/default.tsx` unchanged.

## Current shape

- `User` (`app/models/user.ts`) extends generated `UserSchema`; passwordless (registration change). No club/membership/role entities exist.
- `home` is a route-level `router.on('/').renderInertia('home', {})` gated by `auth` + `completeProfile`; `home.tsx` renders a generic starter hero ("It works …").
- `InertiaMiddleware.share()` shares `errors`, `flash`, `user` (via `UserTransformer`).
- `@adonisplus/permissions@0.0.3` is installed but not configured (no provider, no `start/permissions.ts`, empty `policies/`).

## Target shape

One create-club surface. A profile-complete user with no active club is routed there by a home gate. Submitting name + location founds a club in one transaction — club row (with founder), founder membership, Administrator role grant, and the user's `active_club_id` — then lands on `/`, now the active-club dashboard, showing the club. The active club rides to every page as a shared prop. Roles are a seeded global catalog; only Administrator is assigned. No permission is checked yet.

## Logical schema

Reads: models.md, model-relationships.md, migrations.md, schema-rules.md, authorization.md

```dbml
Table clubs {
  id                 integer    [pk, increment]
  name               varchar    [not null]
  location           varchar    [not null]
  created_by_user_id integer    [not null, ref: > users.id]
  created_at         timestamp  [not null]
  updated_at         timestamp  [null]

  indexes {
    (created_by_user_id) [name: 'clubs_created_by_user_id_index']
  }
}

Table memberships {
  id         integer    [pk, increment]
  club_id    integer    [not null, ref: > clubs.id]   // onDelete cascade
  user_id    integer    [not null, ref: > users.id]   // onDelete cascade
  created_at timestamp  [not null]
  updated_at timestamp  [null]
  indexes { (club_id, user_id) [unique, name: 'memberships_club_user_unique'] }
}

Table roles {
  id          integer   [pk, increment]
  name        varchar   [not null, unique]
  permissions text      [not null, default: '[]']
  created_at  timestamp [null]
  updated_at  timestamp [null]
}

Table membership_roles {
  id            integer [pk, increment]
  membership_id integer [not null, ref: > memberships.id]  // onDelete cascade
  role_id       integer [not null, ref: > roles.id]        // onDelete cascade
  indexes { (membership_id, role_id) [unique, name: 'membership_roles_unique'] }
}

// users gains:
Ref: users.active_club_id > clubs.id   // nullable
```

- **Duplicate rule — app-enforced, case-insensitive.** No DB unique constraint on `(name, location)`; the validator queries the founder's own clubs with trimmed, lowercased `name` + `location`.
- **Scope-membership authz (per `authorization.md`).** Authorization subject = `Membership`. `withRoles` on `Membership`, `withPermissions` on `Role`. Roles are a global catalog.
- **Role catalog seeded** with the 6 names; only Administrator is assigned at creation.
- **`active_club_id`** nullable, set to the new club on creation.
- **Cascades:** deleting a club cascades its memberships; deleting a membership cascades its `membership_roles`.

## Migrations + models

Reads: migrations.md, models.md, authorization.md

`node ace make:model Club --migration` · `node ace make:model Membership --migration` · `node ace make:model Role --migration` · `node ace make:migration membership_roles --create=membership_roles` · `node ace make:migration add_active_club_id_to_users --alter=users` · `node ace make:migration seed_default_roles`

Migration files (ordered):

- `..._create_clubs_table.ts` — `name`, `location` (`notNullable`); `created_by_user_id` unsigned FK → `users.id` `onDelete('CASCADE')`; non-unique index on `created_by_user_id`; two explicit timestamps.
- `..._create_memberships_table.ts` — `club_id` FK → `clubs.id` CASCADE, `user_id` FK → `users.id` CASCADE; `unique(['club_id','user_id'])`; two timestamps.
- `..._create_roles_table.ts` — `name` `notNullable().unique()`; `permissions` text `defaultTo('[]')`; two nullable timestamps.
- `..._create_membership_roles_table.ts` — pivot: `membership_id` FK → `memberships.id` CASCADE, `role_id` FK → `roles.id` CASCADE; `unique(['membership_id','role_id'])`; no timestamps.
- `..._add_active_club_id_to_users.ts` — add `active_club_id` unsigned nullable FK → `clubs.id` `onDelete('SET NULL')`.
- `..._seed_default_roles.ts` — `this.defer` idempotent upsert of the 6 role names (`permissions: '[]'`). Migration-based seed (not a `make:seeder`) so the catalog is guaranteed wherever migrations run — dev, CI, prod, and the test suite's `db().migrate()` — since founding fails without the Administrator row.

Values (hand-authored):

- `app/values/role.ts` (new) — `RoleName` `as const` (`ADMINISTRATOR: 'Administrator'`, `HEAD_COACH: 'Head Coach/Head Teacher'`, `TEACHER: 'Teacher'`, `DECK_SUPERVISOR: 'Deck Supervisor'`, `PARENT: 'Parent'`, `STUDENT: 'Student'`) + exported type. Consumed by the seed migration and the Administrator grant.

Model files:

- `app/models/club.ts` (new) — `Club extends ClubSchema`.
  - `@belongsTo(() => User, { foreignKey: 'createdByUserId' })` `creator`
  - `@hasMany(() => Membership)` `memberships`
- `app/models/membership.ts` (new) — `Membership extends compose(MembershipSchema, withRoles({ roleModel: () => Role, pivotTable: 'membership_roles', pivotForeignKey: 'membership_id' }))` — the scope-membership authorization subject.
  - `@belongsTo(() => Club)` `club`
  - `@belongsTo(() => User)` `user`
  - `roles` — from the `withRoles` mixin, via the pivot.
- `app/models/role.ts` (new) — `Role extends compose(RoleSchema, withPermissions())`.
- `app/models/user.ts` (modified) — add relationships (no `withRoles` — scope-membership keeps roles on `Membership`):
  - `@hasMany(() => Membership)` `memberships`
  - `@hasMany(() => Club, { foreignKey: 'createdByUserId' })` `createdClubs`
  - `@belongsTo(() => Club, { foreignKey: 'activeClubId' })` `activeClub`

`node ace migration:run` — regenerates `database/schema.ts` (`ClubSchema`, `MembershipSchema`, `RoleSchema`; `UserSchema` gains `activeClubId`).

## Service design

Reads: controllers.md, services.md

- `app/services/club_founding_service.ts` — `ClubFoundingService`. `node ace make:service club_founding`
  - `found(founder: User, data: { name: string; location: string }): Promise<Club>` — in a single managed transaction: create `Club` (`name`, `location`, `createdByUserId = founder.id`) → create the founder `Membership` via `club.related('memberships').create({ userId: founder.id })` → resolve the Administrator `Role` (`Role.findByOrFail('name', RoleName.ADMINISTRATOR)`) and `attach` it to `membership.related('roles')` → set `founder.activeClubId = club.id` and save. Returns the created `Club`.
    - **Atomicity invariant:** all four writes bound to one transaction (per `transactions.md`); a failure rolls back the whole founding — no orphan club, membership, or dangling active-club pointer.
    - **Depends on** the seeded Administrator role row; `findByOrFail` throws if the catalog is missing.
  - Does NOT: validate input, run the duplicate-club precondition, flash, or redirect — those stay in `ClubsController.store`. HTTP-agnostic (no `HttpContext` / `request` / `response`).

## Validation

Reads: validation.md, vine/types/string.md

### Input validation

`node ace make:validator club`

```ts title="app/validators/club.ts"
import vine from '@vinejs/vine'

// uniqueClubForFounder — custom rule (vine.createRule); reports its message inline on failure
export const storeClubValidator = vine.withMetaData<{ userId: number }>().create({
  name: vine.string().trim().minLength(1).maxLength(255).use(uniqueClubForFounder()),
  location: vine.string().trim().minLength(1).maxLength(255),
})
```

### Business rules

- **Required fields.** `name` + `location` required — Vine defaults (empty→`null` via the app's `convertEmptyStringsToNull`, so `required` fires). Exact strings pinned by `assert.md`, per the registration precedent.
- **Duplicate-club rule.** Owner: `uniqueClubForFounder`, a custom rule authored via `vine.createRule` in `app/validators/club.ts`. On the `name` field; founder-scoped (`field.meta.userId`), case-insensitive, matched on `name` + sibling `field.parent.location`. On a match it calls `field.report(...)` with the literal **"You already have a club with this name and location."** → renders as `errors.name`. Build implements the rule body per Vine's `createRule` API.
  - Controller passes meta: `request.validateUsing(storeClubValidator, { meta: { userId: user.id } })`.
  - **No change to `start/validator.ts`** — the message is embedded in the rule, keeping registration's default validation messages intact (a global `SimpleMessagesProvider` risked clobbering them).

## Authorization + segregation

Reads: authorization.md, authentication.md

- **Policies:** none. No runtime permission/ownership gate exists in this change (and no `make:policy` generator). Deferred to member-invitation.
- **Permission / role keys:** deferred. **No `start/permissions.ts`.** Roles are seeded with empty permission arrays (`'[]'`); the Administrator grant records role membership via the pivot, not permission keys. The checking layer (keys, bouncer, `<Guard>`, `userPermissions`) lands with member-invitation.
- **Access model — authentication + state gates only:**
  - `clubs.create` / `clubs.store` — `auth` + `completeProfile`. Not role-gated (open to any signed-in, profile-complete user).
  - `home` — `auth` + `completeProfile` + the **active-club gate** (redirects no-active-club users to `clubs.create`). A state gate, not a permission.
- **Query segregation:**
  - `ClubsController.store` — founder via `auth.getUserOrFail()`; the duplicate check is scoped to the founder through validator meta (`created_by_user_id = user.id`). No client-supplied user id is trusted.
  - Active-club gate reads `auth.getUserOrFail().activeClubId` — current user only; no cross-user query.

## Controllers

Reads: controllers.md, http-context.md, request.md, middleware.md, model-relationships.md

- `app/controllers/clubs_controller.ts` (new) — `ClubsController`. `node ace make:controller clubs`
  - `create` — wiring: `inertia.render('clubs/create')`. No props beyond shared. Renders the create-club form; where the active-club gate (and the later "Create a club" affordance) send the user.
  - `store` — method-injected `ClubFoundingService`. Wiring: `auth.getUserOrFail()` → `request.validateUsing(storeClubValidator, { meta: { userId: user.id } })` → `clubFoundingService.found(user, payload)` → `session.flash('success', …)` → `response.redirect().toRoute('home')`.
    - **Ordering invariant:** resolve user → validate **with `meta: { userId }`** (the duplicate rule needs it) → found → flash → redirect. Validation throws on failure; the global handler redirects back with `errors.name` (duplicate) / `errors.name` + `errors.location` (required) — no `try/catch`.
    - **Non-default path:** transactional founding delegated to `ClubFoundingService`.
    - No authz call — open to any authenticated, profile-complete user.
    - Flash success copy: club-created confirmation (e.g. `` `${club.name} created` ``); exact string is an `assert.md` open question.
- DI: method-level `@inject()` on `store` only (single consumer).
- Per-action middleware overrides: none on the controller; route-level gates applied in Routes.

## Response layer

Reads: transformers.md, response.md, session.md, exception-handling.md

- `app/transformers/club_transformer.ts` — `ClubTransformer extends BaseTransformer<Club>`. `node ace make:transformer club`
- Fields needing transformation: none.
- Pass-through fields: `this.pick(this.resource, ['id', 'name', 'location'])`.
- Relationships to preload before transform: none.
- Runtime context required: none (synchronous `toObject()`).

- `app/middleware/inertia_middleware.ts` (modified) — add a shared `activeClub` prop alongside `user`:
  - `share()` becomes `async`; when `auth?.user?.activeClubId` is set, load the club (`Club.find(user.activeClubId)`) and share `activeClub: ctx.inertia.always(club ? ClubTransformer.transform(club) : undefined)`; otherwise `undefined`. Keeps the existing partial-hydration guard (`auth` as `Partial<HttpContext>`).
  - **Cost invariant:** one DB read per authenticated Inertia render; acceptable for the foundation (a later optimization can preload `activeClub` on the auth user).
  - `SharedProps` auto-updates via the existing `InferSharedProps<InertiaMiddleware>` augmentation — pages read `activeClub` as a typed shared prop.
- Flash + redirect ride the established pattern (`session.flash('success', …)` + `response.redirect().toRoute('home')`). Validation failures throw `E_VALIDATION_ERROR`; the global handler redirects back with errors via Inertia shared state. No custom exception.

## Routes

Reads: routing.md, middleware.md

New middleware — `node ace make:middleware active_club`

- `app/middleware/active_club_middleware.ts` — `ActiveClubMiddleware`. `handle(ctx, next)`: `const user = ctx.auth.getUserOrFail()` → if `!user.activeClubId` return `ctx.response.redirect().toRoute('clubs.create')`; else `return next()`. Runs after `auth()` + `completeProfile()`; applied only to `home` in this change. Reads `activeClubId` (a column already on the auth user; no DB query).

```diff title="start/kernel.ts"
 export const middleware = router.named({
   guest: () => import('#middleware/guest_middleware'),
   auth: () => import('#middleware/auth_middleware'),
   completeProfile: () => import('#middleware/complete_profile_middleware'),
+  activeClub: () => import('#middleware/active_club_middleware'),
 })
```

```diff title="start/routes.ts"
 router
   .on('/')
   .renderInertia('home', {})
   .use(middleware.auth())
   .use(middleware.completeProfile())
+  .use(middleware.activeClub())
   .as('home')
+
+router
+  .group(() => {
+    router.get('clubs/create', [controllers.Clubs, 'create'])
+    router.post('clubs', [controllers.Clubs, 'store'])
+  })
+  .use(middleware.auth())
+  .use(middleware.completeProfile())
```

- Home gate chain: `auth → completeProfile → activeClub → render`. A no-active-club user is bounced to `clubs.create`.
- Clubs routes need `auth` + `completeProfile` but **not** `activeClub` (that's where no-club users are sent) — their own group, separate from the existing auth-only group (which hosts `complete-profile` / `logout`).
- Resulting names (auto): `clubs.create`, `clubs.store`.

Verify route names with `node ace list:routes`.

## Events + side effects

Reads: (none — no events or side effects in this change)

_None._ Club founding is purely transactional DB writes — no email, notification, domain event, or listener.

## Views

Reads: frontend.md, design-system.md, transformers.md

- `inertia/pages/clubs/create.tsx` (new) — page component; the create-club form. `node ace make:page clubs/create`
  - Props: `InertiaProps<{}>` — shared only (`errors`, `flash`, `user`, `activeClub`); `ClubsController.create` renders no page-specific props.
  - Layout: global default (mirror existing pages — no explicit `.layout`).
  - Form submit target: `ClubsController.store` via `<Form route="clubs.store">` (POST derived).
  - Fields: `name` (text), `location` (text); submit "Create club" `disabled={processing}`; render `errors.name` (required + duplicate) and `errors.location`. Mirror `.form-container` / `.button` / `data-invalid`, matching `complete_profile.tsx`.
  - Heading copy (e.g. "Create a club"): a stable marker / exact copy is an `assert.md` open question.
  - Composes: none new — page-owned form JSX (inline-form convention).
- `inertia/pages/home.tsx` (modified) — the active-club dashboard.
  - Reads `activeClub` from shared props: `function Home({ activeClub }: InertiaProps<{}>)` — `Data.SharedProps` now carries `activeClub: Data.Club | undefined`.
  - Renders the active club's `name` + `location` as the dashboard (replaces the generic "It works" hero); includes a `<Link route="clubs.create">` "Create a club" affordance (satisfies "available afterward for additional clubs"). Guards `activeClub` for `undefined` though the gate guarantees its presence here.
- `inertia/layouts/default.tsx` (unchanged) — active-club nav display deferred.

No new component files — both surfaces are page-owned JSX, matching `complete_profile.tsx` / `login.tsx`.

## Test coverage gap

No existing tests for clubs / memberships / roles. New coverage required (plan owned by `assert.md`), all viable with the Japa browser client:

- **Create-club form** renders for a profile-complete user (via `clubs.create`).
- **Founding (valid):** `POST /clubs` with name + location creates the club, makes the founder its Administrator (membership + `membership_roles` row), sets `active_club_id`, and lands on `/` showing the club's name/location.
- **Required fields:** missing name or location re-renders with the field error(s); no club created.
- **Duplicate rule:** a second club with the same name + location (case-insensitive) for the same founder re-renders with `errors.name` ("You already have a club with this name and location."); no club created. Same name at a **different** location succeeds.
- **Multi-club:** creating a second club switches `active_club_id` to the newer club.
- **Active-club gate:** an authenticated, profile-complete user with no active club hitting `/` is redirected to `clubs.create`; with an active club, `/` renders the dashboard.
- **Role catalog:** the 6 roles are seeded and present.

**Registration test updates — owned by this change.** Registration's **T6** and **T9** assert `text=It works` on `/` for profile-complete users who have no club. Under the active-club gate those users are now redirected to `clubs.create`, so both break. Update T6/T9 to expect the `clubs.create` landing (or to seed the user an active club before visiting `/`). Recommendation: add `registration` to this change's `affects` with a MODIFIED home-landing delta so `/flow-sync` records the behavior change.

---
