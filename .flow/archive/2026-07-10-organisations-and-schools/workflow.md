---
planned: 2026-07-10
built: 2026-07-10
affects: [organisations, schools, clubs, memberships, invitations, signups, programs, user-profile]
---

# Organisations and Schools — Workflow

> Task type: capability change
> Stack: AdonisJS

## Summary

Introduce `Organisation` as the parent account/business above schools, rename the existing `club` tenant language to `school`, and attach premium status to organisations. Memberships and roles remain school-scoped; users may belong to multiple organisations, with one active organisation and one active school at a time.

## Invariants

Existing memberships, invitations, public sign-ups, swim programs, level settings, roles, permissions, users, and profile completion behavior must keep their data and behavior through the rename. School-scoped permission checks must continue to resolve from the user's active-school membership. Public sign-up links must remain deterministic after the URL shape changes to organisation slug + school slug. No organisation-level roles are introduced in this change.

## Blast radius

Database migrations and generated schema; `Club` model and all `club_id` relationships; active-club middleware/shared props; club creation/onboarding; invitation creation and acceptance; memberships and role assignment; signups and notification emails; program/level settings; routes, generated route/page/type references, Inertia pages/components/layout, validators, transformers, services, state docs, and user-visible copy.

## Out of scope

- Organisation-level memberships or roles — organisations are parent account containers only in this change; permissions remain school-scoped.
- Premium-management UI — organisation premium status is added and defaults to non-premium, but no user-facing toggle is built here.
- Student/class progression — remains with the paused `swimming-class` change.

## Steps

### Step 1 — Introduce organisation schema and school ownership

Reads: migrations.md, models.md, model-relationships.md, transactions.md, schema-rules.md

#### Harness rules — verbatim, migrations.md:16-33

> - Scaffold migrations via `node ace make:migration <name> --create=<table>` or `--alter=<table>`. Files land in `database/migrations/` with timestamp prefixes.
> - Generate a model alongside its first migration via `node ace make:model <Name> --migration`.
> - Each migration extends `BaseSchema` from `@adonisjs/lucid/schema`. Implement `async up()` / `async down()`. Set `protected tableName = '...'`.
> - Use `static disableTransactions = true` only when a specific statement cannot run inside a transaction (e.g., PostgreSQL `CREATE INDEX CONCURRENTLY`).
> - Use `this.schema.createTable(name, cb)` / `alterTable(name, cb)` / `dropTable(name)` for DDL.
> - Use `createTableIfNotExists` / `dropTableIfExists` when the migration must be resilient to partial prior state.
> - `await this.schema.renameTable(from, to)` returns `Promise<void>` and cannot be chained.
> - Guard schema changes that may run with diverging history via `await this.schema.hasTable(...)` and `await this.schema.hasColumn(...)`.
> - Use the schema builder over raw SQL when the builder expresses the operation. `this.schema.raw(sql)` accepts only a SQL string (no bindings).
> - Use `this.raw(sql, bindings)` from `BaseSchema` for parameterized SQL, then pass the result into a builder method (e.g., `defaultTo`).
> - Use `this.defer(callback)` for data operations (backfills, transforms, cross-table copies). Schema operations and `defer` callbacks run in registration order — DDL → backfill → tighten constraint. Deferred callbacks are skipped in `--dry-run`.
> - Split a large data backfill into its own migration file, separate from destructive DDL.
> - Use two explicit `timestamp('created_at')` and `timestamp('updated_at')` calls. The `timestamps(true, true)` shortcut returns `void` and blocks modifier chaining.
> - Declare foreign keys explicitly with `onDelete` (and `onUpdate` where it matters): `table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE')`.
> - Use column-level shorthand for single-column FKs; use table-level `table.foreign(cols)` for composite or named keys.
> - Use column-level modifiers (`.notNullable()`, `.unique()`, `.index()`) for single-column constraints; table-level (`table.primary([...])`, `table.unique([...])`, `table.index([...])`) for composite.
> - Toggle nullability via `table.setNullable(column)` / `table.dropNullable(column)`. Use `.alter()` only when restating the full column definition.
> - Backfill non-null defaults before tightening to `notNullable()`. Never apply `.notNullable()` to an existing column with `NULL` values without a prior backfill.

#### Harness rules — verbatim, models.md:15-24

> - Models live in `app/models/<name>.ts` as a default-exported class extending the generated schema class from `#database/schema`.
> - The schema class carries column definitions; the model carries behavior (relationships, hooks, scopes, getters, custom methods, column overrides).
> - Treat `database/schema.ts` as a generated file. Never hand-edit.
> - Scaffold via `node ace make:model <Name>`. Default scaffold for a new model: `--migration --controller --transformer`. Add `--factory` when seeding or testing is planned.
> - Set static configuration only when it differs from defaults: `static table` (snake_case pluralization), `static primaryKey` (`'id'`), `static connection`, `static selfAssignPrimaryKey` (`false`).
> - Apply mixins via `compose(Base, mixinFactory1(), mixinFactory2())` from `@adonisjs/core/helpers`. Last argument wins for overlapping members.
> - Pass a lazy callback (`() => import('#models/user')`) when a config / preload / provider needs a model reference. Static imports at the top level pull Lucid decorators and the generated schema into the boot graph.
> - Place enums and runtime constants in `app/values/<name>.ts`. Place pure type-only exports in `types/<name>.ts`.
> - Use `await model.refresh()` after DB-side defaults or triggers populate columns.
> - Use `model.useTransaction(trx)` to bind a freshly constructed instance to a transaction.

#### Harness rules — verbatim, model-relationships.md:16-24

> - Declare relationships in the model file under `app/models/`, never in the generated schema class. Regenerating `database/schema.ts` does not touch relationships.
> - Anchor directional naming to where the foreign key lives: `belongsTo` (your model holds the FK), `hasOne` (another model's FK points at you, at most one row per parent), `hasMany` (another model's FK points at you, many rows per parent), `manyToMany` (pivot table), `hasManyThrough` (traversal through an intermediate model). Declare both sides so traversal works in either direction.
> - Pass related models as a function returning the class (`() => User`) so resolution is deferred until after every module has loaded. Direct class references cause circular-import failures.
> - Import decorators from `@adonisjs/lucid/orm`: `@belongsTo`, `@hasOne`, `@hasMany`, `@manyToMany`, `@hasManyThrough`. Import type helpers from `@adonisjs/lucid/types/relations`: `BelongsTo`, `HasOne`, `HasMany`, `ManyToMany`, `HasManyThrough`.
> - Use the default key conventions and override only the single key that diverges:
>   - `belongsTo(() => User)` — `foreignKey: 'userId'` on this model, `localKey: 'id'` on `User`.
>   - `hasOne(() => Profile)` — `foreignKey: 'userId'` on `Profile`, `localKey: 'id'` on this model.
>   - `hasMany(() => Post)` — `foreignKey: 'userId'` on `Post`, `localKey: 'id'` on this model.
>   - `manyToMany(() => Skill)` — `pivotForeignKey: 'user_id'`, `pivotRelatedForeignKey: 'skill_id'`, `pivotTable: 'skill_user'` (alphabetical snake_case), `localKey: 'id'`, `relatedKey: 'id'`.

#### Harness rules — verbatim, transactions.md:15-20

> - Default to the managed form `db.transaction(async (trx) => ...)`. Returns the callback's resolved value; rethrows the original error on rollback.
> - Build every query, insert, update, delete, raw call, and model write off `trx`, never `db`. Queries issued through `db` inside the callback run outside the transaction and commit immediately.
> - Pass `{ client: trx }` to model queries and finders (`Model.query({ client: trx })`, `Model.find(id, { client: trx })`, `findOrFail`, `findBy`) so reads see the transaction's uncommitted writes. Same option on DB queries: `db.query({ client: trx }).from(...)`.
> - Rely on finder auto-attachment: a model loaded through `{ client: trx }` has `$trx` set, so subsequent writes stay in the transaction without a second call.
> - Rely on relationship inheritance: `instance.related('rel').create(...)` / `save(...)` / `attach(...)` on a `$trx`-bound instance inherits the transaction automatically.
> - Call `instance.useTransaction(trx)` for models constructed in code (not loaded from a trx-bound query) before the first save.

#### Harness rules — verbatim, schema-rules.md:15-17

> - Schema rules are overrides. Add a rule only when the generator's default emission for the column is wrong or needs narrowing. For unruled columns the generator emits the internal-type default — nullable datetime columns map to `DateTime | null` with `@column.dateTime`, integer columns to `number`, etc. — with nullability inherited from the DB.
> - Place schema rules in `database/schema_rules.ts`. Wire `schemaGeneration.rulesPaths` per-connection inside `connections.<name>` in `config/database.ts` (alongside `migrations`). Assert with `satisfies SchemaRules` from `@adonisjs/lucid/types/schema_generator`.
> - Top-level keys: `types`, `columns`, `tables`, `primaryKey`. Keep every key present even when empty — diffs stay meaningful as the file grows.

#### Decision

- `database/migrations/<timestamp>_create_organisations_table.ts` (new)
  - `node ace make:migration organisations --create=organisations`
  - Create `organisations`: `id`, `name`, `slug`, `is_premium` default `false`, `created_by_user_id`, `created_at`, `updated_at`.
  - `slug` is globally unique; `created_by_user_id` references `users.id` with `onDelete('CASCADE')`.
- `database/migrations/<timestamp>_add_organisation_to_clubs_table.ts` (new)
  - `node ace make:migration add_organisation_to_clubs --alter=clubs`
  - Add nullable `organisation_id` to `clubs`, then backfill, then tighten to not nullable.
  - Add unique `(organisation_id, slug)` and `(organisation_id, lower(name), lower(location))` behavior through app validation; keep the existing global `slug` until Step 2 removes/renames the table-level constraint safely.
- `database/migrations/<timestamp>_backfill_organisations_for_existing_clubs.ts` (new)
  - Backfill one organisation per current `created_by_user_id`; all existing clubs created by that user join that organisation.
  - Deterministic backfill name: first club name for that creator plus ` Organisation`; deterministic slug from that name with numeric suffixes on collisions.
  - Backfill runs with `this.defer(...)`; split from destructive rename work.
- `app/models/organisation.ts` (new)
  - `node ace make:model Organisation`
  - Extends `OrganisationSchema` and declares `creator: belongsTo User` plus `schools/clubs: hasMany` during transition.
- `app/models/club.ts` (modified in this step only)
  - Add temporary `organisation: belongsTo Organisation` while table is still named `clubs`.
- `database/schema.ts` (generated)
  - Regenerated by `node ace migration:run`; never hand-edit.
- `node ace migration:run`

### Step 2 — Gate

1. Format — `npm run format`
2. Lint — `npm run lint`
3. Typecheck — `npm run typecheck`

`lint` and `typecheck` must pass before the next step; a failure is fixed in place and execution then continues — no halt, no escalation. `format` is never gated. The project test suite is not run here.

### Step 3 — Rename core tenant language from club to school

Reads: migrations.md, models.md, model-relationships.md, controllers.md, routing.md, transformers.md

#### Harness rules — verbatim, migrations.md:22-23

> - `await this.schema.renameTable(from, to)` returns `Promise<void>` and cannot be chained.
> - Guard schema changes that may run with diverging history via `await this.schema.hasTable(...)` and `await this.schema.hasColumn(...)`.

#### Harness rules — verbatim, models.md:15-17

> - Models live in `app/models/<name>.ts` as a default-exported class extending the generated schema class from `#database/schema`.
> - The schema class carries column definitions; the model carries behavior (relationships, hooks, scopes, getters, custom methods, column overrides).
> - Treat `database/schema.ts` as a generated file. Never hand-edit.

#### Harness rules — verbatim, model-relationships.md:16-18

> - Declare relationships in the model file under `app/models/`, never in the generated schema class. Regenerating `database/schema.ts` does not touch relationships.
> - Anchor directional naming to where the foreign key lives: `belongsTo` (your model holds the FK), `hasOne` (another model's FK points at you, at most one row per parent), `hasMany` (another model's FK points at you, many rows per parent), `manyToMany` (pivot table), `hasManyThrough` (traversal through an intermediate model). Declare both sides so traversal works in either direction.
> - Pass related models as a function returning the class (`() => User`) so resolution is deferred until after every module has loaded. Direct class references cause circular-import failures.

#### Harness rules — verbatim, controllers.md:15-17

> - Scaffold via `node ace make:controller <name>`. One controller class per file at `app/controllers/<name>_controller.ts`, default-exported `<Name>Controller`.
> - Type actions as class methods with `HttpContext` first. Destructure only what the action needs (`{ inertia, request, response, session, params }`).
> - Wire routes via `[controllers.<Name>, 'action']` from `#generated/controllers`. The barrel at `.adonisjs/server/controllers.ts` is auto-maintained.

#### Harness rules — verbatim, routing.md:20-23

> - Wire controller-backed routes via `[controllers.<Name>, 'action']` from `#generated/controllers`.
> - Reference routes by their auto-generated name. Pattern: `<snake_case_controller>.<method>` — `PostsController.index` → `posts.index`, `CategoryArchivesController.store` → `category_archives.store`, `TwoFactorAuthController.update` → `two_factor_auth.update`. Multi-word controllers always snake_case, never camelCase.
> - Skip `.as(...)` when the auto-generated name is acceptable. Reach for `.as(...)` only when (a) renaming a controller route to something other than the auto name, or (b) naming a non-controller route (inline handler, brisk route) that other code resolves URLs against.
> - Discover route names with `node ace list:routes`. Never infer a route name by reading the controller file and snake_casing in your head — run the command and read the registered name. Never invent a name you have not seen in the command output.

#### Harness rules — verbatim, transformers.md:16-24

> - Generate transformers with `node ace make:transformer <name>`.
> - Author one transformer per resource.
> - Type `BaseTransformer<TResource>` to the input shape.
> - Define the response shape in `toObject()`.
> - Return `this.pick(this.resource, [...])` directly for pure column whitelists.
> - Spread `...this.pick(...)` then add fields when the shape also computes or relates.
> - Make `toObject()` async only when it awaits external work.
> - Wrap Lucid relations in `RelatedTransformer.transform(this.whenLoaded(this.resource.<rel>))`. Missing preloads return `undefined` and Inertia omits the key.
> - Preload every wrapped relation in the controller.

#### Decision

- `database/migrations/<timestamp>_rename_clubs_to_schools.ts` (new)
  - `node ace make:migration rename_clubs_to_schools --alter=clubs`
  - Rename `clubs` table to `schools` guarded by `hasTable`; rename indexes and foreign key column targets through follow-up alter statements as SQLite allows.
  - Rename referencing columns: `memberships.club_id` → `school_id`, `invitations.club_id` → `school_id`, `signups.club_id` → `school_id`, `club_level_settings.club_id` → `school_id`.
  - Rename `users.active_club_id` in Step 5, not here, because active context changes with organisation context.
- Files renamed/replaced (modified/new/deleted as needed)
  - `app/models/club.ts` → `app/models/school.ts`; class `School extends SchoolSchema`.
  - `app/transformers/club_transformer.ts` → `app/transformers/school_transformer.ts`.
  - `app/controllers/clubs_controller.ts` → `app/controllers/schools_controller.ts`.
  - `app/services/club_founding_service.ts` → `app/services/school_founding_service.ts`.
  - `app/validators/club.ts` → `app/validators/school.ts`.
  - `inertia/pages/clubs/create.tsx` → `inertia/pages/schools/create.tsx`.
- Existing resource models (modified)
  - `Membership`, `Invitation`, `Signup`, `ClubLevelSetting`, `User`, `SignupCaptureService`, `ProgramTransformer`, `LevelTransformer`, and related controllers switch to `schoolId`, `activeSchoolId`, and `School` imports.
  - Temporary compatibility aliases are not kept after the gate; remove club-named imports in the same step.
- `start/routes.ts` (modified)
  - Replace `clubs/create` + `clubs.store` with `schools/create` + `schools.store`.
  - Keep route names auto-generated from `SchoolsController` unless a compatibility redirect is intentionally added; verify with `node ace list:routes`.
- `database/schema.ts`, `.adonisjs/server/controllers.ts`, `.adonisjs/server/routes.d.ts`, `.adonisjs/client/data.d.ts` (generated)
  - Regenerate via `node ace migration:run` and the framework generation hooks; never edit generated files by hand.
- `node ace migration:run`
- `node ace list:routes`

### Step 4 — Gate

1. Format — `npm run format`
2. Lint — `npm run lint`
3. Typecheck — `npm run typecheck`

`lint` and `typecheck` must pass before the next step; a failure is fixed in place and execution then continues — no halt, no escalation. `format` is never gated. The project test suite is not run here.

### Step 5 — Add active organisation and active school context

Reads: authentication.md, middleware.md, http-context.md, authorization.md, response.md, session.md, transformers.md

#### Harness rules — verbatim, authentication.md:20-22

> - Use `middleware.auth()` to protect routes. Pass `guards: [...]` only when the route must accept or require specific guards.
> - Use `auth.use('guard')` only for guard-specific methods such as `login`, `logout`, `createToken`, or `invalidateToken`.
> - When code needs an authenticated user, make sure the route is protected with `middleware.auth(...)` and then read the user with `auth.getUserOrFail()`.

#### Harness rules — verbatim, middleware.md:17-28

> - Scaffold middleware via `node ace make:middleware <Name>`. Keep one default-exported class per file at `app/middleware/<name>_middleware.ts`.
> - Register the global exception handler in `start/kernel.ts` via `server.errorHandler(() => import('#exceptions/handler'))`.
> - Use `server.use([...])` for middleware that must run on every HTTP request, even when no route matches.
> - Use `router.use([...])` for middleware that should run only after a route matches.
> - Use `export const middleware = router.named({ ... })` for route- or group-level middleware applied explicitly via `.use(...)`.
> - Import the middleware file lazily in `start/kernel.ts` via `() => import('#middleware/<name>_middleware')`.
> - Type middleware handlers with `HttpContext` first and `NextFn` second.
> - Keep the default shape `async handle(ctx: HttpContext, next: NextFn, options?)`.
> - Put pre-handler logic before `await next()`. Put post-handler logic after `await next()`.
> - Return `next()` after post-handler logic completes. Return an HTTP response early only when the middleware intentionally terminates the request.
> - Use constructor injection with `@inject()` when the middleware needs a service dependency.
> - Type named-middleware options explicitly and pass them as the third `handle(...)` parameter.

#### Harness rules — verbatim, http-context.md:15-33

> - Treat `HttpContext` as request-scoped. Never share it across requests.
> - Import the type via `import type { HttpContext } from '@adonisjs/core/http'`.
> - Type controller actions with `HttpContext` as the first parameter.
> - Type middleware handlers with `HttpContext` first and `NextFn` from `@adonisjs/core/types/http` second.
> - Destructure only the properties the handler needs (`{ request, response, params }`).
> - Always-available core properties:
>   - `request` — incoming `HttpRequest`.
>   - `response` — outgoing `HttpResponse`.
>   - `params` — parsed route params; values are strings unless a route matcher casts them.
>   - `route` — matched route definition; `undefined` when no route matched.
>   - `logger` — request-scoped logger that auto-includes the request id.
> - Optional-package properties exist only when the package is installed and registered: `session` (`@adonisjs/session`), `auth` (`@adonisjs/auth`), `view` (`@adonisjs/edge`), `inertia` (`@adonisjs/inertia`), `bouncer` (`@adonisjs/bouncer`), `i18n` (`@adonisjs/i18n`).
> - Project scaffolding may attach more: `containerResolver` (request-scoped IoC resolver) and `serialize` (added by `providers/api_provider.ts` on API and Inertia stacks).
> - Pass `HttpContext` to services explicitly through constructor or method injection.
> - Use class-level `@inject()` when several methods of a service consume `HttpContext`.
> - Use method-level `@inject()` when only one method needs it.
> - Reach for async local storage (`HttpContext.getOrFail()`) only when the call site cannot accept `HttpContext` as a parameter.
> - Enable async local storage via `useAsyncLocalStorage: true` in `config/app.ts`.
> - Augment the `HttpContext` interface via TypeScript module augmentation when adding custom request-scoped data (e.g., a resolved tenant). Assign in middleware that runs before any consumer.

#### Harness rules — verbatim, authorization.md:39-43

> - Scope-membership apps: modify `app/middleware/authorize_middleware.ts` to load the active membership and call `permissions.createAccessFor(membership)`.
> - Token scoping: modify the middleware to read `ctx.auth.user.currentAccessToken?.abilities` and call `access.scopeTo(abilities)` before the check.
> - Inside abilities and policies, set custom message and status via `AuthorizationResponse.deny(message, status)`. The thrown exception carries them.
> - Share the user's full permission set with the frontend as `userPermissions: PermissionKey[]` from `InertiaMiddleware.share()`, wrapped in `ctx.inertia.once(...)`. Empty array for guests. Partial reloads that do not request `userPermissions` skip the resolution.
> - Read shared permissions via `<Guard>` from `~/utils/permissions`. Forms: `<Guard for="key">` (single), `<Guard for={[...]}>` (OR), `<Guard for={[...]} match="all">` (AND).

#### Harness rules — verbatim, response.md:20-31

> - Use `inertia.always(value | async fn)` for props that must survive every partial reload (auth, flash, cross-cutting state).
> - Use `inertia.defer(async () => ...)` for slow props that should not block first paint. Pair with a skeleton fallback on the page.
> - Group deferred props with `inertia.defer(fn, 'group-name')` so multiple keys arrive in one follow-up request.
> - Use `inertia.defer(fn).merge()` (or `.deepMerge()`) to append the deferred result. Use eager `inertia.merge(value)` when the value is already in hand at render time (e.g., infinite-scroll appends).
> - Use `inertia.location(url)` for redirects to destinations outside the app (cross-origin URLs, OAuth providers, payment processors). For in-app navigation, `response.redirect(...)`.
> - Call `inertia.clearHistory()` before rendering or redirecting when the next page must not be reachable via the back button (post-logout, post-account-delete, post-password-change).
> - Call `inertia.encryptHistory()` before rendering pages whose props contain sensitive data in browser history (account settings, billing, secrets). For app-wide encryption, set `encryptHistory: true` in `config/inertia.ts`.
> - Do not set the response status manually after a PUT, PATCH, or DELETE redirect — the framework auto-upgrades to 303.
> - Read `.adonisjs/server/pages.d.ts` to confirm the page name and prop interface.
> - Wrap rich types (models, classes) with a transformer at the top level only.
> - Pass plain objects directly when no transformer-backed serialization is needed.
> - After a successful form submission, `session.flash('success', message)` then `response.redirect().toRoute(name, params)`.

#### Harness rules — verbatim, session.md:23-31

> - Flash success messages with `session.flash('success', message)`.
> - Flash recoverable errors with `session.flash('error', message)`.
> - Flash before redirecting. Flash data is meant for the next request.
> - After successful writes, flash `success` then redirect to a named route.
> - After recoverable form errors, flash `error` then redirect back.
> - In Edge layouts, read flashed messages via the global `flashMessages` helper.
> - In Inertia middleware, share `session.flashMessages.get('success')` and `session.flashMessages.get('error')` so layouts can render them once.
> - Use `session.flashAll()`, `session.flashOnly([...])`, or `session.flashExcept([...])` only when manually preserving submitted form data after a non-validation failure.
> - Let `request.validateUsing(...)` handle validation failures. Validation errors and old input are flashed automatically.

#### Harness rules — verbatim, transformers.md:23-24

> - Wrap Lucid relations in `RelatedTransformer.transform(this.whenLoaded(this.resource.<rel>))`. Missing preloads return `undefined` and Inertia omits the key.
> - Preload every wrapped relation in the controller.

#### Decision

- `database/migrations/<timestamp>_add_active_organisation_and_school_to_users.ts` (new)
  - Rename `users.active_club_id` → `active_school_id` if still present.
  - Add nullable `active_organisation_id` referencing `organisations.id`.
  - Backfill `active_organisation_id` from each user's active school organisation.
- `app/models/user.ts` (modified)
  - Replace `activeClubId`/`activeClub` with `activeOrganisationId`, `activeOrganisation`, `activeSchoolId`, `activeSchool`.
  - Preserve profile-completion behavior; no organisation-level membership is added.
- `app/middleware/active_club_middleware.ts` → `app/middleware/active_school_middleware.ts` (renamed/modified)
  - Redirect signed-in/profile-complete users without active organisation or active school to `schools.create`.
  - Validate active school belongs to active organisation when both are present; if invalid, reset to a school in the active organisation or redirect to school creation.
- `app/middleware/authorize_middleware.ts` (modified)
  - Load active-school membership by `schoolId = user.activeSchoolId` and `userId = user.id`.
  - Continue using `permissions.createAccessFor(membership)`; permissions remain school-scoped.
- `app/middleware/inertia_middleware.ts` (modified)
  - Share `activeOrganisation`, `activeSchool`, and `availableSchools` for the active organisation.
  - Share `userPermissions` from active-school membership only.
- `app/transformers/organisation_transformer.ts` (new)
  - `node ace make:transformer organisation`
  - Includes `id`, `name`, `slug`, `isPremium`.
- `app/transformers/school_transformer.ts` (modified/new)
  - Includes `id`, `organisationId`, `name`, `location`, `slug`.

### Step 6 — Gate

1. Format — `npm run format`
2. Lint — `npm run lint`
3. Typecheck — `npm run typecheck`

`lint` and `typecheck` must pass before the next step; a failure is fixed in place and execution then continues — no halt, no escalation. `format` is never gated. The project test suite is not run here.

### Step 7 — Update school creation flows

Reads: controllers.md, services.md, validation.md, request.md, response.md, session.md, authorization.md, transactions.md

#### Harness rules — verbatim, controllers.md:20-27

> - Use method-level `@inject()` when only one action needs the dependency. `HttpContext` first; injected deps after.
> - Keep the action owning its work — validation, model writes, file / storage touches, Inertia render or redirect. See `<harness>/services.md` to decide when to extract a service vs keep work inline. Move shared types to project-root `types/`.
> - Export only the controller class from the file.
> - Use `inertia.render('page/path', { props })` for page-rendering actions.
> - Read `.adonisjs/server/pages.d.ts` to confirm the page name and prop interface before authoring the props object.
> - Wrap rich types (models, classes) with a transformer at the top level only.
> - Pass plain objects directly when no transformer-backed serialization is needed.
> - Form submissions end with `session.flash('success' | 'error', message)` followed by `response.redirect().toRoute(name, params)` (or `.back()`).

#### Harness rules — verbatim, services.md:17-22

> - Extract a service only when the logic is dense and encapsulates a real business domain — multi-step workflows with invariants, cross-model coordination with business rules, processes a domain expert would name (subscription renewal, invoice settlement, post moderation, onboarding, refund processing).
> - Apply the **naming test** before scaffolding. Would the service's name mean something in the product, or only in the codebase? Names that pass — `SubscriptionRenewalService`, `InvoiceSettlementService`, `OnboardingService`. Names that fail — `AccountAvatarService`, `UserProfileService`, `PostCardService`. A `<Resource>Service` name with no business verb is a sign the controller and model should own the work.
> - Scaffold via `node ace make:service <name>`. One service class per file at `app/services/<name>_service.ts`, default-exported `<Name>Service`.
> - Name service methods after the domain steps they encapsulate (`renew(subscription)`, `settle(invoice)`, `moderate(post)`) — not after plumbing verbs (`saveAndNotify`, `processData`, `handle`).
> - Pass models, validated payloads, and other rich server values into service methods. Services read model properties directly on the server. Return models, value objects, or domain results.
> - Inject a service into a controller via class-level `@inject()` when several actions need it; method-level `@inject()` when only one does. See `<harness>/controllers.md` for the injection patterns.

#### Harness rules — verbatim, validation.md:41-56

> - Scaffold validators via `node ace make:validator <resource>` (singular).
> - Place validator files under `app/validators/` named after the resource in singular form. Group action-specific validators for the same resource in one file.
> - Pre-compile with `vine.create({...})`. Use `vine.create(vine.object({...}))` only when the top-level schema is built separately.
> - Export one named validator per use case (`createUserValidator`, `updateUserValidator`, `signupValidator`).
> - Duplicate field rules by default. VineJS chains are cheap; readability beats reuse.
> - Reach for `.partial(...)`, `.pick(...)`, `.omit(...)`, `.getProperties()` only at 5+ identical fields with no rule variance across siblings.
> - Field-factory helpers (`const password = () => vine.string().minLength(8)...`) only across 3+ different resources where no validator owns the rule. Never for siblings of the same resource.
> - Import VineJS as `import vine from '@vinejs/vine'`.
> - Fields are required by default. Use `.optional()` to allow `undefined`/`null` and drop the field when `undefined`. Use `.nullable()` to require the field but allow `null` (preserved). Use `.nullable().optional()` for both.
> - Apply `request.validateUsing(<validator>)` in controllers. Body fields at top level. User-supplied headers under `headers` key in a nested `vine.object(...)`. Other nested keys for query string or merged data.
> - Route params are not validated through the validator — read via `params` on `HttpContext`, constrain shape via route matchers.
> - Cookies are not validated through the validator — read via `request.encryptedCookie(...)` / `request.cookie(...)` / `request.plainCookie(...)`.
> - Let `request.validateUsing(...)` throw — the global handler converts via content negotiation:
>   - API: 422 with `{ errors: [{ field, rule, message }] }`.
>   - Inertia: redirect back; errors via Inertia shared state.
>   - Hypermedia: redirect back; errors flashed to the session.

#### Harness rules — verbatim, request.md:15-23

> - Funnel every request body and any query / header data the route treats as trusted input through `request.validateUsing(<validator>)`. The validator owns runtime safety and TypeScript safety; downstream layers trust the payload.
> - Destructure `request` from `HttpContext` in controller actions.
> - Validate body, query strings, and user-supplied headers in one validator when the route consumes them as trusted input data. Body fields at the top level. User-supplied headers under a `headers` key in a nested `vine.object(...)`. Other nested keys cover query string or merged data.
> - Validate uploaded files via `vine.file(...)` rules. The payload exposes the file as a typed `MultipartFile`.
> - Read validated values from the `validateUsing(...)` return payload — body fields at the top level; nested input sources under their declared keys.
> - Read route params via `params` on `HttpContext`. Constrain shape via `.where('param', router.matchers.*)` on the route definition. Route params are not validated through `validateUsing`.
> - Let `request.validateUsing(...)` throw on failure. The global handler converts via content negotiation:
>   - API (JSON): 422 with `{ errors: [{ field, rule, message }] }`.
>   - Inertia (React / Vue): redirect back; errors exposed via Inertia shared state.

#### Harness rules — verbatim, authorization.md:37-43

> - Authorize before validating. Call `bouncer.with(Policy).authorize(...)` before `request.validateUsing(...)`.
> - Global handler converts `errors.E_AUTHORIZATION_FAILURE` to flash + redirect-back. No `try`/`catch`.
> - Scope-membership apps: modify `app/middleware/authorize_middleware.ts` to load the active membership and call `permissions.createAccessFor(membership)`.
> - Token scoping: modify the middleware to read `ctx.auth.user.currentAccessToken?.abilities` and call `access.scopeTo(abilities)` before the check.
> - Inside abilities and policies, set custom message and status via `AuthorizationResponse.deny(message, status)`. The thrown exception carries them.
> - Share the user's full permission set with the frontend as `userPermissions: PermissionKey[]` from `InertiaMiddleware.share()`, wrapped in `ctx.inertia.once(...)`. Empty array for guests. Partial reloads that do not request `userPermissions` skip the resolution.
> - Read shared permissions via `<Guard>` from `~/utils/permissions`. Forms: `<Guard for="key">` (single), `<Guard for={[...]}>` (OR), `<Guard for={[...]} match="all">` (AND).

#### Harness rules — verbatim, transactions.md:15-20

> - Default to the managed form `db.transaction(async (trx) => ...)`. Returns the callback's resolved value; rethrows the original error on rollback.
> - Build every query, insert, update, delete, raw call, and model write off `trx`, never `db`. Queries issued through `db` inside the callback run outside the transaction and commit immediately.
> - Pass `{ client: trx }` to model queries and finders (`Model.query({ client: trx })`, `Model.find(id, { client: trx })`, `findOrFail`, `findBy`) so reads see the transaction's uncommitted writes. Same option on DB queries: `db.query({ client: trx }).from(...)`.
> - Rely on finder auto-attachment: a model loaded through `{ client: trx }` has `$trx` set, so subsequent writes stay in the transaction without a second call.
> - Rely on relationship inheritance: `instance.related('rel').create(...)` / `save(...)` / `attach(...)` on a `$trx`-bound instance inherits the transaction automatically.
> - Call `instance.useTransaction(trx)` for models constructed in code (not loaded from a trx-bound query) before the first save.

#### Decision

- `app/services/school_founding_service.ts` (modified/renamed)
  - `node ace make:service school_founding` if the renamed file does not exist.
  - `foundFirstSchool(founder, payload)` creates organisation + school + Administrator membership + active organisation/school in one transaction.
  - `addSchool(founder, payload)` creates a school under an existing organisation only when the founder has Administrator or Head Coach permission through an existing school in that organisation; otherwise creates a new organisation + first school path.
- `app/validators/school.ts` (modified/new)
  - `node ace make:validator school` if the renamed file does not exist.
  - First-school validator: `organisationName`, `schoolName`, `location`.
  - Additional-school validator: `organisationId` optional/new-organisation branch, `organisationName` when creating a new organisation, `schoolName`, `location`.
  - Duplicate prevention: organisation slug globally unique; school slug unique within organisation; school name + location case-insensitive unique within organisation.
- `app/controllers/schools_controller.ts` (modified/new)
  - `create` renders `schools/create` with organisations the user can add schools to plus first-school mode when none exists.
  - `store` validates, calls `SchoolFoundingService`, flashes success with school name, redirects to `home`.
- `start/permissions.ts` and grant migration (modified/new)
  - Add `school.create` (or `school.manage` if build chooses one key for school settings) and grant to Administrator + Head Coach.
  - Existing first-school creation remains available to signed-in/profile-complete users with no school; adding to existing organisation requires the new permission through a school in that organisation.

### Step 8 — Gate

1. Format — `npm run format`
2. Lint — `npm run lint`
3. Typecheck — `npm run typecheck`

`lint` and `typecheck` must pass before the next step; a failure is fixed in place and execution then continues — no halt, no escalation. `format` is never gated. The project test suite is not run here.

### Step 9 — Update memberships, invitations, and acceptance

Reads: models.md, model-relationships.md, controllers.md, validation.md, authorization.md, mail.md, url-builder.md, transactions.md

#### Harness rules — verbatim, models.md:59-60

> - Use `fill` or `merge`. `fill` replaces the attribute bag; `merge` patches selected keys. On a loaded instance, prefer `merge`.
> - Use static finders (`findBy`, `firstOrCreate`) or `Model.query().where(...).first()`. Reach for the query builder when the lookup needs ordering, joins, scopes, preloads, or conditional filters.

#### Harness rules — verbatim, model-relationships.md:39-45

> - `manyToMany`: `attach(ids | mapOfPivots)`, `detach(ids?)`, `sync(targetSet, performDetach?)`, `save(instance, performSync?, pivot?)`, `saveMany(instances, performSync?, pivotAttrs[])`, `create(values, pivot?)`, `createMany(rowsArray, pivotArray?)`.
> - `hasManyThrough`: read-only — persist through the intermediate relationship.
> - Every persistence helper wraps its work in a managed transaction, sets the foreign key from the parent automatically, and rolls back on failure.
> - Use `sync(targetSet)` when reconciling pivot state against a full target set (form submit with a multi-select, bulk updates). `targetSet` can be an array of ids or an object whose keys are ids and whose values are pivot attributes. `sync(targetSet, false)` skips the delete step (idempotent attach + update). Use `attach` / `detach` for incremental changes.
> - Read pivot data from `$extras.pivot_<column>` on each related instance. Pivot timestamps land at `$extras.pivot_created_at` / `$extras.pivot_updated_at` (or your custom column names) when `pivotTimestamps` is enabled.
> - For pivot-aware reads, use `wherePivot` / `andWherePivot` / `orWherePivot`, `whereNotPivot`, `whereInPivot` / `whereNotInPivot` (and OR variants) on the relationship query — regular `where` clauses target the related model's columns. Use `.pivotColumns([...])` per query for one-off pivot fields. Use `related(name).pivotQuery()` for pivot-only counts or updates without loading related rows.
> - Coordinate preloads with serialization: every relationship a transformer reads must be preloaded.

#### Harness rules — verbatim, controllers.md:20-27

> - Use method-level `@inject()` when only one action needs the dependency. `HttpContext` first; injected deps after.
> - Keep the action owning its work — validation, model writes, file / storage touches, Inertia render or redirect. See `<harness>/services.md` to decide when to extract a service vs keep work inline. Move shared types to project-root `types/`.
> - Export only the controller class from the file.
> - Use `inertia.render('page/path', { props })` for page-rendering actions.
> - Read `.adonisjs/server/pages.d.ts` to confirm the page name and prop interface before authoring the props object.
> - Wrap rich types (models, classes) with a transformer at the top level only.
> - Pass plain objects directly when no transformer-backed serialization is needed.
> - Form submissions end with `session.flash('success' | 'error', message)` followed by `response.redirect().toRoute(name, params)` (or `.back()`).

#### Harness rules — verbatim, validation.md:49-60

> - Fields are required by default. Use `.optional()` to allow `undefined`/`null` and drop the field when `undefined`. Use `.nullable()` to require the field but allow `null` (preserved). Use `.nullable().optional()` for both.
> - Apply `request.validateUsing(<validator>)` in controllers. Body fields at top level. User-supplied headers under `headers` key in a nested `vine.object(...)`. Other nested keys for query string or merged data.
> - Route params are not validated through the validator — read via `params` on `HttpContext`, constrain shape via route matchers.
> - Cookies are not validated through the validator — read via `request.encryptedCookie(...)` / `request.cookie(...)` / `request.plainCookie(...)`.
> - Let `request.validateUsing(...)` throw — the global handler converts via content negotiation:
>   - API: 422 with `{ errors: [{ field, rule, message }] }`.
>   - Inertia: redirect back; errors via Inertia shared state.
>   - Hypermedia: redirect back; errors flashed to the session.
> - Use `<compiledValidator>.validate(data, options?)` directly when validating outside an HTTP request (jobs, commands, services). The caller handles failures.
> - Use `vine.file(...)` for multipart file validation. Validated files come back as typed `MultipartFile` instances.
> - Use `vine.group(...)` or `vine.union(...)` when conditional branches change the output shape (discriminated unions). Use `vine.unionOfTypes(...)` when union members are distinct types and need no custom predicates. Reach for `.requiredWhen(...)` only when the object shape stays the same and one field's required-ness depends on another.
> - Whitelist fixed-set fields with `vine.enum(...)` or `vine.literal(...)` (status, role, kind, category) rather than open-ended strings.

#### Harness rules — verbatim, mail.md:18-24

> - Scaffold mail classes with `node ace make:mail <name>`. Use mail classes for reusable application emails and configure the message inside `prepare()`.
> - Author email HTML with MJML templates. Install `mjml` if it is missing.
> - Pair each HTML MJML template with a plain-text template and render both from the mail class.
> - Email templates passed to `htmlView` / `textView` are Edge `.edge` files. Author their markup with Edge syntax — see `<harness>/edge-syntax.md` for the template language.
> - Use `await mail.sendLater(...)` for application emails so request handling does not wait on the provider.
> - Switch mailers with `mail.use('<name>')` only when an email must go through a non-default provider.
> - Set recipients, subject, and content on the mail class message builder. Use the global `from` and `replyTo` settings unless an email needs to override them.

#### Harness rules — verbatim, url-builder.md:15-28

> - Generate internal app URLs from named routes. Do not hardcode paths that already have route names.
> - Import `urlFor` from `@adonisjs/core/services/url_builder` in backend code outside templates and redirect chains.
> - Use object params (`{ id: post.id }`) by default so generated URLs stay readable when routes have multiple params.
> - Pass an empty params array (`[]`) when a route has no params and the call needs the third options argument.
> - Add query strings via the third options argument: `{ qs: { ... } }`.
> - Use Edge's `urlFor(...)` helper for links inside Edge templates.
> - Use the Hypermedia starter kit's `@link` component when building ordinary route links in Hypermedia views.
> - Redirect to internal named routes via `response.redirect().toRoute(name, params, options?)`. Do not build a URL string first.
> - In Inertia React and Vue pages, use the Adonis Inertia `Link` / `Form` route props for ordinary navigation and form submission. Use frontend `urlFor(...)` only when a URL string is required, such as query-string links.
> - Generate signed URLs only in backend code with `signedUrlFor(...)`.
> - Add `prefixUrl` when a signed URL leaves the app boundary, such as email, SMS, or external notifications.
> - Set `expiresIn` on signed URLs that should stop working after a time window.
> - Verify signed URLs in the target route with `request.hasValidSignature()` before trusting query-string data carried by the URL.
> - Run `node ace list:routes` when a route name or param name is unclear.

#### Harness rules — verbatim, transactions.md:15-20

> - Default to the managed form `db.transaction(async (trx) => ...)`. Returns the callback's resolved value; rethrows the original error on rollback.
> - Build every query, insert, update, delete, raw call, and model write off `trx`, never `db`. Queries issued through `db` inside the callback run outside the transaction and commit immediately.
> - Pass `{ client: trx }` to model queries and finders (`Model.query({ client: trx })`, `Model.find(id, { client: trx })`, `findOrFail`, `findBy`) so reads see the transaction's uncommitted writes. Same option on DB queries: `db.query({ client: trx }).from(...)`.
> - Rely on finder auto-attachment: a model loaded through `{ client: trx }` has `$trx` set, so subsequent writes stay in the transaction without a second call.
> - Rely on relationship inheritance: `instance.related('rel').create(...)` / `save(...)` / `attach(...)` on a `$trx`-bound instance inherits the transaction automatically.
> - Call `instance.useTransaction(trx)` for models constructed in code (not loaded from a trx-bound query) before the first save.

#### Decision

- `app/models/membership.ts` (modified)
  - Membership remains school-scoped; relationship becomes `school: belongsTo School`.
  - Role pivot remains `membership_roles`.
- `app/models/invitation.ts` (modified)
  - Invitation targets `schoolId`, not `clubId`; through `school.organisationId` it belongs to an organisation.
- `app/controllers/invitations_controller.ts` and `app/validators/invitation.ts` (modified)
  - Render school wording.
  - Validate active school context and role values as today.
  - Store invitation by `(schoolId, email)`, not `(clubId, email)`.
- `app/services/invitation_acceptance_service.ts` (modified)
  - Accepting an invitation creates/fetches the user, creates/fetches membership for the invited school, attaches the invited role, sets `activeOrganisationId` to the invited school's organisation, sets `activeSchoolId` to the invited school, and stamps `acceptedAt` in one transaction.
- `app/mails/invitation.ts` and email templates (modified)
  - Use school and organisation wording in subject/content.
  - Keep `mail.sendLater(...)`; do not inline mail callbacks in controllers.
- `app/controllers/memberships_controller.ts` (modified)
  - Reads invitation with `school` and `organisation` preloaded before acceptance.
  - Redirects to `home` after login/acceptance as before.

### Step 10 — Gate

1. Format — `npm run format`
2. Lint — `npm run lint`
3. Typecheck — `npm run typecheck`

`lint` and `typecheck` must pass before the next step; a failure is fixed in place and execution then continues — no halt, no escalation. `format` is never gated. The project test suite is not run here.

### Step 11 — Update public sign-up URLs and school-scoped resources

Reads: routing.md, url-builder.md, controllers.md, transformers.md, response.md, authorization.md, frontend.md

#### Harness rules — verbatim, routing.md:24-36

> - Define route params with `:name`. Optional `:name?` and wildcard `*` must be the last segment.
> - Read params from `ctx.params`. Access wildcard segments as `ctx.params['*']`.
> - Validate and cast route params with `.where('param', matcher)`.
> - Use built-in matchers first: `router.matchers.number()`, `router.matchers.uuid()`, `router.matchers.slug()`.
> - Define a global matcher via `router.where('param', matcher)` for app-wide rules.
> - Routes match in registration order. Register static routes before overlapping dynamic ones (e.g., `/posts/archived` before `/posts/:id`).
> - For standard CRUD, use `router.resource('<name>', controllers.<Name>)` — generates seven RESTful actions auto-named `<name>.<action>`.
> - Use `router.resource('parent.child', controllers.Child)` for nested resources. Member actions receive `params.<parent>_id` and `params.id`.
> - Use `router.shallowResource('parent.child', controllers.Child)` when the child id is globally unique and member routes should drop the parent id.
> - Filter a resource surface with `.apiOnly()` (drops `create` + `edit`), `.only([...])`, or `.except([...])`.
> - Apply middleware to selected resource actions via `.use(['action', ...], middleware)`. Use `.use('*', middleware)` to gate every action.
> - Define every resource exactly once. When some actions are public and others gated, apply per-action middleware on the same `router.resource(...)` — never split into two `router.resource(...)` calls.
> - Use route groups (`router.group(() => { ... })`) when several routes share `.prefix(...)`, `.use(middleware)`, `.as(namespace)`, or `.domain(host)`.

#### Harness rules — verbatim, url-builder.md:15-23

> - Generate internal app URLs from named routes. Do not hardcode paths that already have route names.
> - Import `urlFor` from `@adonisjs/core/services/url_builder` in backend code outside templates and redirect chains.
> - Use object params (`{ id: post.id }`) by default so generated URLs stay readable when routes have multiple params.
> - Pass an empty params array (`[]`) when a route has no params and the call needs the third options argument.
> - Add query strings via the third options argument: `{ qs: { ... } }`.
> - Use Edge's `urlFor(...)` helper for links inside Edge templates.
> - Use the Hypermedia starter kit's `@link` component when building ordinary route links in Hypermedia views.
> - Redirect to internal named routes via `response.redirect().toRoute(name, params, options?)`. Do not build a URL string first.
> - In Inertia React and Vue pages, use the Adonis Inertia `Link` / `Form` route props for ordinary navigation and form submission. Use frontend `urlFor(...)` only when a URL string is required, such as query-string links.

#### Harness rules — verbatim, controllers.md:23-27

> - Use `inertia.render('page/path', { props })` for page-rendering actions.
> - Read `.adonisjs/server/pages.d.ts` to confirm the page name and prop interface before authoring the props object.
> - Wrap rich types (models, classes) with a transformer at the top level only.
> - Pass plain objects directly when no transformer-backed serialization is needed.
> - Form submissions end with `session.flash('success' | 'error', message)` followed by `response.redirect().toRoute(name, params)` (or `.back()`).

#### Harness rules — verbatim, transformers.md:23-33

> - Wrap Lucid relations in `RelatedTransformer.transform(this.whenLoaded(this.resource.<rel>))`. Missing preloads return `undefined` and Inertia omits the key.
> - Preload every wrapped relation in the controller.
> - Define variants as additional methods named `for<Purpose>()`. Spread `await this.toObject()` inside, then add or override fields.
> - Select a variant with `Transformer.transform(resource).useVariant('forPurpose')` (type-checked).
> - Build single resources and arrays with `Transformer.transform(...)` — handles both arities.
> - Build paginated results with `Transformer.paginate(rows, meta)`. The page receives `{ data, metadata }`.
> - Pass transformer output directly to `inertia.render('page', { key: Transformer.transform(...) })`.
> - Validate request bodies with `await request.validateUsing(<validator>)` before transforming.
> - Type page props with `InertiaProps<{ key: Data.<Resource> }>` (default) or `InertiaProps<{ key: Data.<Resource>.Variants['forX'] }>` (variant). Import `InertiaProps` from `~/types`, `Data` from `@generated/data`.
> - Format every user-facing value on the backend.
> - Carry formatted values as `{ raw, formatted }`. The page renders `value.formatted` directly.

#### Harness rules — verbatim, authorization.md:42-47

> - Share the user's full permission set with the frontend as `userPermissions: PermissionKey[]` from `InertiaMiddleware.share()`, wrapped in `ctx.inertia.once(...)`. Empty array for guests. Partial reloads that do not request `userPermissions` skip the resolution.
> - Read shared permissions via `<Guard>` from `~/utils/permissions`. Forms: `<Guard for="key">` (single), `<Guard for={[...]}>` (OR), `<Guard for={[...]} match="all">` (AND).
> - Import `Link` / `Form` from `@adonisjs/inertia/react` so route names and type-safe params resolve.
> - For per-row policy-backed outcomes (ownership-aware update/delete), compute inside the transformer's `toObject` via `bouncer.with(Policy).allows('action', this.resource)`. Use `allows` (not `authorize`) — thrown exception would abort the response.
> - Per-row transformer outcomes are for policy-backed gates only. Pure permission-key gates (`post.create`) do not vary by row — read on the page through `<Guard>`.
> - Write paths end with `session.flash('success' | 'error', message)` then `response.redirect()` to a route. Read responses use `inertia.render('page/path', { props })`.

#### Harness rules — verbatim, frontend.md:28-35

> - Navigate with `<Link route="route.name" routeParams={{ ...params }}>` from `@adonisjs/inertia/react`. Method derives from the route — never pass `method` with `route`.
> - For URLs needing a query string, use `<Link href={urlFor('route.name', params, { qs: { ... } })}>`. `href` form requires explicit `method` for non-GET; `route` form derives method.
> - Use `<Link prefetch>` on likely next-page links (primary nav, "next" pagination) to warm cache on hover.
> - For fire-and-forget destructive actions (logout, simple delete), use `<Link route="..." routeParams={{...}} as="button">`. With `href` + `urlFor` (qs needed), pass `method` explicitly.
> - Submit forms with `<Form route="..." routeParams={{...}}>` from `@adonisjs/inertia/react`. Render-prop API: `errors`, `processing`, `wasSuccessful`, `recentlySuccessful`, `progress`, `defaults`, `isDirty`, `reset`, `submit`, `clearErrors`, `resetAndClearErrors`. Method derives from route — never pass `method` or `action`.
> - Disable submit while pending: `<button type="submit" disabled={processing}>`.
> - For create forms that empty after success: `resetOnSuccess`. Add `setDefaultsOnSuccess` when next submits should treat latest as new defaults. `resetOnError` clears on failed submit.
> - Validation errors propagate from server flash through the middleware to `errors`. Render `errors.<field>` next to each input. Never duplicate Vine validators on the page.

#### Decision

- `start/routes.ts` (modified)
  - Public sign-up routes become `GET /register/:organisationSlug/:schoolSlug` and `POST /register/:organisationSlug/:schoolSlug`.
  - Apply `router.matchers.slug()` to both params.
  - Program routes remain authenticated and active-school scoped; comments and labels switch to school.
  - Level settings route and controller use `schoolId` setting rows.
- `app/controllers/signups_controller.ts` (modified)
  - Resolve school by organisation slug + school slug; fail when either slug does not match.
  - Store signups under `schoolId`.
  - List signups for `auth.getUserOrFail().activeSchoolId`.
- `app/services/signup_capture_service.ts`, `app/mails/signup_notification.ts`, `resources/views/emails/signup_notification_*` (modified)
  - School wording; notification recipients are the school's Administrator and Head Coach memberships.
  - Public link generation uses organisation slug + school slug.
- `app/controllers/programs_controller.ts`, `app/controllers/level_settings_controller.ts`, `app/models/club_level_setting.ts`, `app/transformers/level_transformer.ts`, `app/transformers/program_transformer.ts` (modified)
  - Replace club setting scope with school setting scope.
  - Absence of a school-level setting still means available by default and default fee applies.
- `inertia/components/share_signup_link.tsx` and pages using it (modified)
  - Build public URL with both active organisation slug and active school slug.

### Step 12 — Gate

1. Format — `npm run format`
2. Lint — `npm run lint`
3. Typecheck — `npm run typecheck`

`lint` and `typecheck` must pass before the next step; a failure is fixed in place and execution then continues — no halt, no escalation. `format` is never gated. The project test suite is not run here.

### Step 13 — Update UI copy, navigation, generated types, and cleanup

Reads: frontend.md, design-system.md, response.md, routing.md

#### Harness rules — verbatim, frontend.md:17-24

> - Generate every page with `node ace make:page <path>`. Writes `inertia/pages/<path>.tsx` and registers it in the page-component resolver.
> - Page files live at `inertia/pages/<route>.tsx`. `inertia.render('posts/show', ...)` resolves to `inertia/pages/posts/show.tsx`. Lowercase segments.
> - Default-export one PascalCase React component per page file. Nothing else exports.
> - Type page props with `InertiaProps<{...}>` from `~/types`. Inner generic carries the page slot; `InertiaProps` adds shared (`auth`, `flash`, `errors`, custom keys).
> - Reference transformer-derived shapes via `Data.<Resource>` for defaults and `Data.<Resource>.Variants['forX']` for variants, both from `@generated/data`. Never redeclare inline.
> - For paginated props, type as `Paginated<Data.<Resource>>` from `~/types`. Read rows from `posts.data`, pagination from `posts.metadata`.
> - Define `Paginated<T>` once in `inertia/types.ts` alongside `InertiaProps`. Every paginated page imports it.
> - Augment `SharedProps` from `@adonisjs/inertia/types` once with `InferSharedProps<InertiaMiddleware>`. After this, `InertiaProps<{...}>` and `usePage().props` both carry the typed shared shape — no inline generics, no per-component redeclarations.

#### Harness rules — verbatim, frontend.md:39-48

> - One layout = one purpose. Marketing / auth / dashboard get separate files; do not branch one file on shared-prop state.
> - Components are files. Every component in its own file under `inertia/components/<name>.tsx`. No inline subcomponents inside page files.
> - For per-branch content (empty state, mode-driven variant, role-driven section), keep the conditional in the page; place each branch's _content_ in a dedicated component.
> - Extract repeated JSX to a component on first repetition. Two copies is the trigger.
> - For `inertia.defer(...)` props, expect `undefined` on first render. Render a skeleton for the `undefined` branch.
> - Encode filter / sort / pagination state in the URL query string via `urlFor('route', params, { qs: { ... } })`. Controller reads `request.input(...)`. Do not mirror into `useState`.
> - Author every page, layout, component, and hook SSR-safe. Never reference `window`, `document`, `localStorage`, `navigator`, `IntersectionObserver`, or other browser-only APIs at render scope or module top. Read inside `useEffect` only. Lazy-import client-only modules with `React.lazy(() => import(...))` + `<Suspense>`.
> - Place shared types in `inertia/types.ts`; components under `inertia/components/`; hooks under `inertia/hooks/`; helpers under `inertia/utils/`. Create directories on first need.
> - Validate request bodies on the controller via `await request.validateUsing(<validator>)`. Never duplicate on the page.
> - Cross the backend ↔ frontend boundary with Inertia props. Globally shared values (currencies, role keys, feature flags) → `share()` method in `InertiaMiddleware`. Page-scoped values → controller `inertia.render(...)` props via transformer. Types arrive via augmented `SharedProps` and `@generated/data`. UI-only tokens (Tailwind, animation timings) stay in `inertia/`.

#### Harness rules — verbatim, design-system.md:7-11

> - This project has no written design-system guidelines. Discover the system by reading existing code before proposing UI.
> - List directories first. Do not read every file. Use `ls` / `glob` over `inertia/pages/`, `inertia/components/`, `inertia/layouts/` (and any CSS / token files like `inertia/css/`, `tailwind.config.*`) to enumerate what exists.
> - Then read selectively. Pick only files relevant to the current task — the pages being planned, the components those pages will compose, the layout they will sit in. Use the brief + earlier blueprint steps to scope the selection. Skip files that have no bearing on the current change.
> - Reuse existing components by file path. Mirror existing conventions for spacing, color tokens, form patterns, navigation. Do not introduce new component libraries or design tokens.
> - If a needed component does not exist, surface the gap to the user with the closest existing component and a proposal. Do not invent silently.

#### Harness rules — verbatim, response.md:28-31

> - Read `.adonisjs/server/pages.d.ts` to confirm the page name and prop interface.
> - Wrap rich types (models, classes) with a transformer at the top level only.
> - Pass plain objects directly when no transformer-backed serialization is needed.
> - After a successful form submission, `session.flash('success', message)` then `response.redirect().toRoute(name, params)`.

#### Harness rules — verbatim, routing.md:23

> - Discover route names with `node ace list:routes`. Never infer a route name by reading the controller file and snake_casing in your head — run the command and read the registered name. Never invent a name you have not seen in the command output.

#### Decision

- UI files (modified/renamed)
  - Replace user-visible `club` copy with `school`; replace `organization` with `organisation`.
  - `inertia/layouts/default.tsx`: show active organisation and active school; add school switcher for schools inside active organisation; navigation routes switch from `clubs.*` to `schools.*`.
  - `inertia/pages/home.tsx`: active school heading and share sign-up link use school/organisation names.
  - `inertia/pages/schools/create.tsx`: first-school form collects organisation name + school name/location; additional-school form supports existing organisation or new organisation.
  - `inertia/pages/invitations/create.tsx`, `inertia/pages/signups/*`, `inertia/pages/programs/*`, and related components: copy and prop names switch to school.
- Generated files and route references
  - Run `node ace list:routes` after route edits and update every `<Link route=...>`, `<Form route=...>`, `urlFor(...)`, and `response.redirect().toRoute(...)` to route names observed in the command output.
  - Do not edit `.adonisjs/*` or `database/schema.ts` by hand.
- Cleanup
  - Delete obsolete club-named files only after school-named replacements compile and imports are updated.
  - `rg "club|Club|clubs|activeClub|clubId|club_id" app inertia start database resources` should return only intentional historical comments/migration compatibility references after this step.

### Step 14 — Gate (final)

1. Format — `npm run format`
2. Lint — `npm run lint`
3. Typecheck — `npm run typecheck`
4. When `lint` and `typecheck` pass, stamp `built: 2026-07-10` into this file's frontmatter, alongside the existing `planned:` stamp.

The `built:` flag is the task-track completion marker — `/flow-sync` and `/flow-archive` gate on it.
