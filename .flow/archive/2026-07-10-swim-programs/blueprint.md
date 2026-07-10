---
planned: 2026-07-03
built: 2026-07-03
---

# Swim Programs — Implementation Plan

> Task type: greenfield
> Stack: AdonisJS + Inertia React
> Database: SQLite

## Summary

A shared, platform-wide catalog of swim **programs**, each with one or more **levels** (name, age group, description, default fee, capacity). Every club can view the catalog; a club's Administrator or Head Coach authors/edits the shared programs and levels, and sets **their club's own fee override and availability** per level. Fees are stored as integer minor units (GHS).

## Pre-implementation requirements

_None._ Reuses installed packages (`@adonisplus/permissions`, Lucid, Inertia) and the existing scope-membership permission engine.

## Out of scope

- **Multi-currency** — a single app-wide currency (GHS) is assumed; no currency field on fees.
- **Enrolling learners into levels** — the capacity field is captured but unused; booking/enrollment is a later capability.
- **Class/session layer + skills** — the brief defers skills to a future class/session layer beneath a level; not planned here.

## Target shape

Three new tables: `programs`, `levels` (belongs to a program), and `club_level_settings` (a lazy per-`(club, level)` override of fee + availability). A `ProgramsController` (resourceful, `show`-less) manages the shared catalog with levels nested in its store/update; a `LevelSettingsController.update` upserts the active club's per-level fee/availability. A new `program.manage` permission gates all writes; viewing is open to any club member. Programs pages render the catalog with each level showing the viewing club's effective fee + availability.

## Logical schema

Reads: models.md, model-relationships.md, migrations.md, schema-rules.md

```dbml
Table programs {
  id integer [pk, increment]
  name varchar [not null, unique]          // unique platform-wide, case-insensitive (app-enforced)
  description text [not null]
  created_at timestamp [not null]
  updated_at timestamp [null]
}

Table levels {
  id integer [pk, increment]
  program_id integer [not null, ref: > programs.id]   // onDelete cascade
  name varchar [not null]
  age_group varchar [not null]
  description text [not null]
  default_fee integer [not null]           // minor units (pesewas); >= 0
  capacity integer [not null]              // positive whole number
  created_at timestamp [not null]
  updated_at timestamp [null]

  indexes { program_id [name: 'levels_program_id_index'] }
}

Table club_level_settings {
  id integer [pk, increment]
  club_id integer [not null, ref: > clubs.id]    // onDelete cascade
  level_id integer [not null, ref: > levels.id]  // onDelete cascade
  fee integer [null]                       // club override in minor units; null → use level.default_fee
  available boolean [not null, default: true]    // this club's availability for this level
  created_at timestamp [not null]
  updated_at timestamp [null]

  indexes { (club_id, level_id) [unique, name: 'club_level_settings_club_level_unique'] }
}
```

- **Program name** is unique platform-wide, compared **case-insensitively** — app-enforced in the validator (DB unique is a backstop; SQLite unique is case-sensitive).
- **≥1 level per program** at all times — app-enforced (validator `minLength(1)`; the reconcile on update never deletes the last level because the payload always carries ≥1).
- `default_fee` ≥ 0; `capacity` a positive whole number — app-enforced.
- `club_level_settings` rows are **lazy**: created only when a club overrides fee or availability. Absence ⇒ `available = true`, `fee = level.default_fee`. Unique per `(club_id, level_id)`.
- `fee` values are entered as **major units (cedis, ≤2 decimals)** in forms and converted to **minor units** at the service/controller boundary; stored and read as integers.
- No `schema_rules.ts` entry needed — `available` emits as `boolean`, integer columns as `number`, nullable `fee` as `number | null`.

## Migrations + models

Reads: migrations.md, models.md

`node ace make:migration create_programs_table --create=programs`
`node ace make:migration create_levels_table --create=levels`
`node ace make:migration create_club_level_settings_table --create=club_level_settings`

Migration files (ordered):

- `..._create_programs_table.ts` — `programs`; unique index on `name`, two explicit timestamps.
- `..._create_levels_table.ts` — `levels`; `program_id` FK → `programs.id` `onDelete('CASCADE')`, `program_id` index, `default_fee`/`capacity` integers, timestamps.
- `..._create_club_level_settings_table.ts` — `club_level_settings`; `club_id` FK → `clubs.id` and `level_id` FK → `levels.id`, both `onDelete('CASCADE')`; `available` boolean `defaultTo(true)`; `fee` nullable integer; composite unique `(club_id, level_id)`; timestamps.

`node ace make:model Program` · `node ace make:model Level` · `node ace make:model ClubLevelSetting`

Model files:

- `app/models/program.ts` (new) — `Program extends ProgramSchema`. `@hasMany(() => Level)` `declare levels`.
- `app/models/level.ts` (new) — `Level extends LevelSchema`. `@belongsTo(() => Program)` `declare program`; `@hasMany(() => ClubLevelSetting)` `declare clubLevelSettings`.
- `app/models/club_level_setting.ts` (new) — `ClubLevelSetting extends ClubLevelSettingSchema`. `@belongsTo(() => Level)` `declare level`; `@belongsTo(() => Club)` `declare club`.
- `app/models/club.ts` (modified) — add `@hasMany(() => ClubLevelSetting)` `declare levelSettings` (for cascade clarity + future reads).

`node ace migration:run`

## Service design

Reads: controllers.md (services section), services.md

- `app/services/program_authoring_service.ts` — `ProgramAuthoringService`.
  - `create(data: Infer<typeof storeProgramValidator>): Promise<Program>` — in a transaction: create the `Program`, then `createMany` its levels, converting each `defaultFee` (cedis) to minor units (`Math.round(fee * 100)`) and storing `capacity` as-is. Returns the program.
  - `update(program: Program, data: Infer<typeof updateProgramValidator>): Promise<Program>` — in a transaction: update the program's `name`/`description`; **reconcile levels** — payload levels with an `id` that belongs to this program are updated; those without an `id` are created; the program's existing levels whose `id` is absent from the payload are deleted. Fees converted to minor units. Guards that each supplied `id` belongs to `program` (ignores foreign ids). The `minLength(1)` validator guarantees the program keeps ≥1 level.
  - Does NOT: validate, authorize, format money for display, or touch `HttpContext` / flash / redirect.

`node ace make:service program_authoring`

The per-club fee/availability upsert is a single framework call (`updateOrCreate`) and stays inline in `LevelSettingsController` — no service.

## Validation

Reads: validation.md, vine/types/string.md, vine/types/number.md, vine/types/boolean.md, vine/types/array.md, vine/types/object.md

`node ace make:validator program` · `node ace make:validator level_settings`

```ts title="app/validators/program.ts"
import vine from '@vinejs/vine'

const levelObject = {
  name: vine.string().trim().minLength(1).maxLength(120),
  ageGroup: vine.string().trim().minLength(1).maxLength(80),
  description: vine.string().trim().minLength(1).maxLength(2000),
  defaultFee: vine.number().min(0).decimal([0, 2]), // cedis; converted to minor units in the service
  capacity: vine.number().withoutDecimals().positive(),
}

export const storeProgramValidator = vine.create({
  name: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(120)
    .unique({ table: 'programs', column: 'name', caseInsensitive: true }),
  description: vine.string().trim().minLength(1).maxLength(2000),
  levels: vine.array(vine.object(levelObject)).minLength(1),
})

export const updateProgramValidator = vine.withMetaData<{ programId: number }>().create({
  name: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(120)
    .unique({
      table: 'programs',
      column: 'name',
      caseInsensitive: true,
      filter: (db, _value, field) => {
        db.whereNot('id', field.meta.programId)
      },
    }),
  description: vine.string().trim().minLength(1).maxLength(2000),
  levels: vine.array(vine.object({ id: vine.number().optional(), ...levelObject })).minLength(1),
})
```

```ts title="app/validators/level_settings.ts"
import vine from '@vinejs/vine'

export const updateLevelSettingsValidator = vine.create({
  fee: vine.number().min(0).decimal([0, 2]).nullable(), // cedis; null clears the override (use default)
  available: vine.boolean(),
})
```

### Business rules

- **≥1 level** per program. Owner: the `.minLength(1)` array rule (store + update).
- **Case-insensitive unique program name**, excluding self on update. Owner: the validator `unique` rule (`caseInsensitive: true` + `filter` on update).
- **Fee cedis → minor units** conversion. Owner: `ProgramAuthoringService` (level fees) and `LevelSettingsController.update` (override fee).
- **Level `id` ownership** on update (a supplied level id must belong to the program). Owner: `ProgramAuthoringService.update`.

## Authorization + segregation

Reads: authentication.md, authorization.md

Scope-membership authz (permissions resolve through the active-club `Membership`); the existing `authorize_middleware.ts` is reused unchanged.

- `start/permissions.ts` (modified):
  - Add `program: { manage: 'Manage swim programs and levels' }` to `definePermissions(...)`.
  - Add `permissions.getKey('program.manage')` to `rolePermissions[RoleName.ADMINISTRATOR]` and `rolePermissions[RoleName.HEAD_COACH]`.
- `node ace make:migration grant_program_manage_permission` — `this.defer` iterates `rolePermissions` and writes each role's `permissions` JSON (mirrors `..._grant_signup_view_permissions...`); `down` resets those roles to their prior key set.
- No policy class — pure permission-key gate.
- Query segregation:
  - **Catalog reads** (`programs`, `levels`) are global — no club scope.
  - **Per-club fee/availability** — `ProgramsController.index` preloads each level's `clubLevelSettings` filtered to `user.activeClubId`; `LevelSettingsController.update` upserts with `clubId = user.activeClubId`. A club only ever reads/writes its own settings row.

## Controllers

Reads: controllers.md, http-context.md, request.md, middleware.md, model-relationships.md

- `app/controllers/programs_controller.ts` (new) — `ProgramsController`.
  - `index` — wiring: `Program.query().preload('levels', (lq) => lq.preload('clubLevelSettings', (sq) => sq.where('clubId', activeClubId)).orderBy('id')).orderBy('name')`; `inertia.render('programs/index', { programs: ProgramTransformer.transform(programs, activeClubId) })`. Open to all members.
    - Preload the club-filtered `clubLevelSettings` so the transformer resolves each level's effective fee/availability without N+1.
  - `create` — `inertia.render('programs/create', {})`. Gated `program.manage`.
  - `store` — wiring: `request.validateUsing(storeProgramValidator)`, `ProgramAuthoringService.create(payload)`, flash success, redirect `programs.index`. Method-level `@inject()`.
  - `edit` — load program with `preload('levels')`; `inertia.render('programs/edit', { program: ProgramTransformer.transform(program, activeClubId).useVariant('forEdit') })` — the `forEdit` variant emits each level's `defaultFee` back in **cedis** for the form inputs, plus level `id`s. Gated `program.manage`.
  - `update` — wiring: `Program.findOrFail(params.id)`, `request.validateUsing(updateProgramValidator, { meta: { programId: program.id } })`, `ProgramAuthoringService.update(program, payload)`, flash, redirect `programs.index`. Method-level `@inject()`.
  - `destroy` — `Program.findOrFail(params.id)`, `.delete()` (cascades levels + club settings), flash, redirect `programs.index`.
- `app/controllers/level_settings_controller.ts` (new) — `LevelSettingsController`.
  - `update` — wiring: `Level.findOrFail(params.id)`, `request.validateUsing(updateLevelSettingsValidator)`, `ClubLevelSetting.updateOrCreate({ clubId: activeClubId, levelId: level.id }, { fee: fee === null ? null : Math.round(fee * 100), available })`, flash, redirect back (`programs.index`). Gated `program.manage`.

- DI: method-level `@inject()` on `ProgramsController.store` / `.update` only.
- Per-action middleware: applied at the route layer (Step: Routes).

`node ace make:controller programs` · `node ace make:controller level_settings`

## Response layer

Reads: transformers.md, response.md, session.md, exception-handling.md

- `app/transformers/program_transformer.ts` (new) — `ProgramTransformer`. Constructor takes `(resource, clubId: number)` (per-request club, passed as `ProgramTransformer.transform(programs, activeClubId)`).
  - Fields: pass-through `id, name, description`; `levels: LevelTransformer.transform(this.whenLoaded(this.resource.levels), this.clubId)`.
  - `forEdit` variant: spreads `toObject()` and overrides `levels` with the edit shape (each level: `id`, `name`, `ageGroup`, `description`, `capacity`, and `defaultFee` as a **cedis number** = `default_fee / 100`) for form prefill.
  - Preload before transform: `levels`, and each level's club-filtered `clubLevelSettings`.
- `app/transformers/level_transformer.ts` (new) — `LevelTransformer`. Constructor takes `(resource, clubId: number)`.
  - Fields needing transformation:
    - `defaultFee: { raw: number, formatted: string }` — raw minor units; formatted `GHS {(raw/100).toFixed(2)}`.
    - `fee: { raw: number, formatted: string }` — the **club's effective** fee: `setting?.fee ?? default_fee`, same formatting. (`setting` = first of the preloaded club-filtered `clubLevelSettings`.)
    - `available: boolean` — `setting?.available ?? true`.
  - Pass-through fields: `id, name, ageGroup, description, capacity`.
  - Runtime context: the viewing club id via the custom constructor; the club's setting via the preloaded `clubLevelSettings`.
- Money formatting (`GHS X.XX` from minor units) is done inline in the transformer — no i18n package installed; single currency.

`node ace make:transformer program` · `node ace make:transformer level`

## Routes

Reads: routing.md

```diff title="start/routes.ts"
+// Swim programs — shared catalog (all members view; Admin/Head Coach manage) + per-club level settings.
+router
+  .group(() => {
+    router
+      .resource('programs', [controllers.Programs])
+      .except(['show'])
+      .use(['create', 'store', 'edit', 'update', 'destroy'], middleware.authorize('program.manage'))
+
+    router
+      .patch('levels/:id/settings', [controllers.LevelSettings, 'update'])
+      .use(middleware.authorize('program.manage'))
+  })
+  .use(middleware.auth())
+  .use(middleware.completeProfile())
+  .use(middleware.activeClub())
```

Auto route names: `programs.index/create/store/edit/update/destroy`, `level_settings.update`. Verify route names with `node ace list:routes`.

## Events + side effects

Reads: —

_None._ Creating, editing, or removing programs and levels, and setting per-club fee/availability, produce no emails, events, or async side effects (unlike the sign-up flow).

## Views

Reads: frontend.md, transformers.md, design-system.md

Follows the project design system as discovered at build time (currently migrating to Mantine). Forms reuse the modal-driven add/edit pattern established by the sign-up flow (`learner_modal`).

- `inertia/pages/programs/index.tsx` (new) — page; owns composition only.
  - Props: `{ programs: Data.Program[] }` — each `Data.Program` has `id, name, description, levels: Data.Level[]`; each `Data.Level` has `id, name, ageGroup, description, capacity, defaultFee: { raw, formatted }, fee: { raw, formatted }, available: boolean`.
  - Composes: `ProgramCard` (per program); a "Create program" link and per-program edit/remove behind `<Guard for="program.manage">`.
  - Navigation: `programs.create`, `programs.edit`.
- `inertia/pages/programs/create.tsx` (new) — page; renders `ProgramForm` in create mode. Submit target: `programs.store`.
- `inertia/pages/programs/edit.tsx` (new) — page; props `{ program: Data.Program.Variants['forEdit'] }`; renders `ProgramForm` prefilled. Submit target: `programs.update` (routeParams `{ id }`).
- `inertia/components/program_form.tsx` (new) — shared create/edit form: program `name` + `description`, plus a dynamic list of levels managed via `LevelModal` with a summary + hidden inputs (mirrors the sign-up learner pattern); enforces ≥1 level client-side. Extracted as: shared-across-two-pages form.
- `inertia/components/level_modal.tsx` (new) — add/edit one level (name, age group, description, fee in cedis, capacity) with client-side required checks. Extracted as: repeated add/edit dialog (mirrors `learner_modal`).
- `inertia/components/program_card.tsx` (new) — one program with its levels; each level shows age group, description, capacity, the club's fee + availability; for managers, per-level settings control + program edit/remove. Extracted as: repeated JSX (one per program).
- `inertia/components/level_settings_control.tsx` (new) — manager control on a level: set the club's fee and toggle availability; submit target `level_settings.update` (routeParams `{ id }`). Extracted as: a branch's content (manager-only), one per level.
- `inertia/layouts/default.tsx` (modified) — add a **Programs** navigation entry (`programs.index`); visible to any member (viewing needs no permission).

## Test coverage gap

No existing tests cover `programs`. New tests (plan owned by `assert.md`) will need, at the browser level: a member views the catalog and sees each level's club fee + availability; an Administrator/Head Coach creates a program with ≥1 level (persisted, unique-name and zero-level and invalid fee/capacity rejections); edits a program and reconciles levels (add/update/remove, last-level-removal blocked); removes a program (cascades); sets a club's fee override + availability and it affects only that club (a second club still sees the default); and a non-manager member can view but is denied every write (Guard hidden + route 403). Money is asserted via the formatted `GHS` output and the stored minor-unit rows.
