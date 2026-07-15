---
planned: 2026-07-10
built: 2026-07-15
---

# Swimming Class — Implementation Plan

> Task type: greenfield
> Stack: AdonisJS + Inertia React
> Database: SQLite

## Summary

Build a school-scoped swimming class feature: managers create recurring class series under available program levels, assign active or pending Teacher instructors, define ordered stages and skills, generate scheduled sessions, and let school members view/cancelled-aware schedules. The plan normalizes the original club wording to schools, with organisation premium status unlocking platform default skills for schools in premium organisations.

## Target shape

A school member can browse classes from the dashboard. Administrators and Head Coaches/Head Teachers can create, edit, and cancel class series from the Classes area or from an available program level, with class codes, schedules, stages, school-specific/default skills, and active or pending instructors handled as one authoring workflow.

## Logical schema

Reads: models.md, model-relationships.md, migrations.md, schema-rules.md

```dbml
Table swimming_classes {
  id integer [pk, increment]
  school_id integer [not null, ref: > schools.id]
  level_id integer [not null, ref: > levels.id]
  code string [not null]
  name string [not null]
  start_date date [not null]
  end_date date [not null]
  start_time time [not null]
  end_time time [not null]
  capacity integer [not null]
  location string [not null]
  instructor_membership_id integer [ref: > memberships.id]
  pending_instructor_invitation_id integer [ref: > invitations.id]
  cancelled_at timestamp
  created_at timestamp [not null]
  updated_at timestamp

  indexes {
    (school_id, code) [unique, name: 'swimming_classes_school_code_unique']
    (school_id, level_id) [name: 'swimming_classes_school_level_index']
    (instructor_membership_id) [name: 'swimming_classes_instructor_membership_index']
    (pending_instructor_invitation_id) [name: 'swimming_classes_pending_instructor_invitation_index']
  }
}

Table swimming_class_weekdays {
  id integer [pk, increment]
  swimming_class_id integer [not null, ref: > swimming_classes.id]
  weekday integer [not null]
  created_at timestamp [not null]
  updated_at timestamp

  indexes {
    (swimming_class_id, weekday) [unique, name: 'swimming_class_weekdays_class_weekday_unique']
  }
}

Table swimming_class_sessions {
  id integer [pk, increment]
  swimming_class_id integer [not null, ref: > swimming_classes.id]
  starts_at timestamp [not null]
  ends_at timestamp [not null]
  cancelled_at timestamp
  created_at timestamp [not null]
  updated_at timestamp

  indexes {
    (swimming_class_id, starts_at) [unique, name: 'swimming_class_sessions_class_start_unique']
    (starts_at) [name: 'swimming_class_sessions_starts_at_index']
  }
}

Table class_stages {
  id integer [pk, increment]
  swimming_class_id integer [not null, ref: > swimming_classes.id]
  name string [not null]
  position integer [not null]
  created_at timestamp [not null]
  updated_at timestamp

  indexes {
    (swimming_class_id, position) [unique, name: 'class_stages_class_position_unique']
  }
}

Table skills {
  id integer [pk, increment]
  school_id integer [ref: > schools.id]
  name string [not null]
  description text
  is_default boolean [not null, default: false]
  created_by_user_id integer [ref: > users.id]
  created_at timestamp [not null]
  updated_at timestamp

  indexes {
    (school_id, name) [name: 'skills_school_name_index']
    (is_default, name) [name: 'skills_default_name_index']
  }
}

Table class_stage_skills {
  id integer [pk, increment]
  class_stage_id integer [not null, ref: > class_stages.id]
  skill_id integer [not null, ref: > skills.id]
  created_at timestamp [not null]
  updated_at timestamp

  indexes {
    (class_stage_id, skill_id) [unique, name: 'class_stage_skills_stage_skill_unique']
  }
}

Table invitations {
  id integer [pk, increment]
  school_id integer [not null, ref: > schools.id]
  role_id integer [not null, ref: > roles.id]
  email string [not null]
  invitee_name string
  invitee_phone string
  token string [not null]
  expires_at timestamp [not null]
  accepted_at timestamp
  created_at timestamp [not null]
  updated_at timestamp
}
```

Prose invariants DBML cannot fully carry:

- SQLite is the database; schema rules are not expected for these tables unless generation later mis-types `time` or boolean columns.
- `swimming_classes.code` is a visible class code. Manual input is allowed; blank input is auto-generated. Before save, codes are trimmed, uppercased, and kept unique per school.
- A class belongs to exactly one school and one program level. The selected level must be available for that school through `school_level_settings` or by the default “available” behavior.
- `instructor_membership_id` and `pending_instructor_invitation_id` are mutually exclusive at the application layer: an accepted instructor uses a school membership; a pending Teacher invited during class creation uses the invitation.
- The accepted instructor membership must belong to the same school and hold Teacher or Head Coach/Head Teacher; this is enforced in service/controller logic, not with a database constraint.
- Pending instructor invitations must be Teacher invitations for the same school; `invitee_name` and `invitee_phone` are nullable for existing invitation flows but required when inviting a Teacher from class creation.
- Weekdays are app-layer enum integers, proposed as `1..7`; validation rejects dates/times that produce no sessions.
- Scheduled sessions are generated rows, not user-authored one by one. Cancelling a class or session sets `cancelled_at`; rows remain visible.
- Skills are either school-specific (`school_id` set, `is_default=false`) or platform defaults (`school_id=null`, `is_default=true`). Premium access is derived from `schools.organisation_id -> organisations.is_premium`.
- Skill-name uniqueness and availability are app-layer rules: school-specific skill names are unique case-insensitively within a school; platform default skill names are unique case-insensitively across defaults.
- `class_stage_skills` references skills directly; deleting a skill used by a class should be restricted or omitted from this change because class progression history must stay readable.
- Program/level deletion behavior should be treated carefully in implementation: classes depend on levels for display and validation; the plan should prefer restricting deletion of levels with classes unless the product explicitly wants cascading removal.

## Migrations + models

Reads: migrations.md, models.md

`node ace make:migration add_instructor_profile_to_invitations --alter=invitations`

`node ace make:migration skills --create=skills`

`node ace make:migration swimming_classes --create=swimming_classes`

`node ace make:migration swimming_class_weekdays --create=swimming_class_weekdays`

`node ace make:migration swimming_class_sessions --create=swimming_class_sessions`

`node ace make:migration class_stages --create=class_stages`

`node ace make:migration class_stage_skills --create=class_stage_skills`

Migration files (ordered):

- `database/migrations/<timestamp>_alter_invitations_table.ts` — add nullable `invitee_name` and `invitee_phone` so class-created Teacher invitations can carry the pending instructor snapshot while existing invitation flows remain valid.
  - Harness invariant: alter existing tables with `node ace make:migration <name> --alter=<table>`.
  - Harness invariant: use schema builder DDL and explicit `up()` / `down()` methods.
- `database/migrations/<timestamp>_create_skills_table.ts` — create skills as school-specific or platform-default progression items.
  - `school_id` nullable FK to `schools.id`, `onDelete('CASCADE')`; null means platform default.
  - `created_by_user_id` nullable FK to `users.id`, `onDelete('SET NULL')`.
  - `is_default` defaults false; platform defaults use `is_default=true`.
  - Index `(school_id, name)` and `(is_default, name)` for duplicate checks and picker queries; case-insensitive uniqueness remains app-layer because SQLite expression uniqueness is not portable through the standard schema builder.
  - Harness invariant: use two explicit timestamp columns, not `timestamps(true, true)`.
- `database/migrations/<timestamp>_create_swimming_classes_table.ts` — create class series under schools and program levels.
  - `school_id` FK to `schools.id`, `onDelete('CASCADE')`.
  - `level_id` FK to `levels.id`, `onDelete('RESTRICT')` so a level with scheduled classes cannot silently disappear.
  - `instructor_membership_id` nullable FK to `memberships.id`, `onDelete('SET NULL')`.
  - `pending_instructor_invitation_id` nullable FK to `invitations.id`, `onDelete('SET NULL')`.
  - Unique `(school_id, code)` and supporting indexes for level/instructor/pending-invitation lookups.
  - `cancelled_at` nullable timestamp marks cancellation without hiding the class.
- `database/migrations/<timestamp>_create_swimming_class_weekdays_table.ts` — store the recurring weekdays selected for a class.
  - `swimming_class_id` FK to `swimming_classes.id`, `onDelete('CASCADE')`.
  - Unique `(swimming_class_id, weekday)`; weekday is an integer app-layer enum `1..7`.
- `database/migrations/<timestamp>_create_swimming_class_sessions_table.ts` — store generated schedule sessions.
  - `swimming_class_id` FK to `swimming_classes.id`, `onDelete('CASCADE')`.
  - Unique `(swimming_class_id, starts_at)` prevents duplicate generated sessions.
  - `cancelled_at` nullable timestamp marks single-session cancellation.
- `database/migrations/<timestamp>_create_class_stages_table.ts` — store ordered progression stages for each class.
  - `swimming_class_id` FK to `swimming_classes.id`, `onDelete('CASCADE')`.
  - Unique `(swimming_class_id, position)` keeps class-stage order deterministic.
- `database/migrations/<timestamp>_create_class_stage_skills_table.ts` — pivot stages to skills.
  - `class_stage_id` FK to `class_stages.id`, `onDelete('CASCADE')`.
  - `skill_id` FK to `skills.id`, `onDelete('RESTRICT')` so class progression history remains readable if a skill has been used.
  - Unique `(class_stage_id, skill_id)`.

`node ace make:model Skill`

`node ace make:model SwimmingClass`

`node ace make:model SwimmingClassWeekday`

`node ace make:model SwimmingClassSession`

`node ace make:model ClassStage`

`node ace make:model ClassStageSkill`

Model files:

- `app/models/skill.ts` (new) — `Skill extends SkillSchema`.
  - `@belongsTo(() => School)` — nullable owner school for school-specific skills.
  - `@belongsTo(() => User, { foreignKey: 'createdByUserId' })` — nullable creator for school-specific skills.
  - `@hasMany(() => ClassStageSkill)` — pivot rows using the skill.
  - `isDefault` column override — consume/prepare boolean for SQLite safety, following the existing `SchoolLevelSetting.available` pattern.
  - `scope availableToSchool(school)` — query school-specific skills plus default skills only when the school’s organisation is premium; intent is picker and validation reuse.
- `app/models/swimming_class.ts` (new) — `SwimmingClass extends SwimmingClassSchema`.
  - `@belongsTo(() => School)` — active school owner.
  - `@belongsTo(() => Level)` — selected program level.
  - `@belongsTo(() => Membership, { foreignKey: 'instructorMembershipId' })` — accepted instructor membership.
  - `@belongsTo(() => Invitation, { foreignKey: 'pendingInstructorInvitationId' })` — pending Teacher invitation.
  - `@hasMany(() => SwimmingClassWeekday)` — selected recurrence weekdays.
  - `@hasMany(() => SwimmingClassSession)` — generated sessions.
  - `@hasMany(() => ClassStage)` — ordered progression stages.
  - `get isCancelled` — true when `cancelledAt` is set.
  - `get hasPendingInstructor` — true when `pendingInstructorInvitationId` is set and `instructorMembershipId` is null.
  - `cancel()` — sets `cancelledAt`; rows remain visible.
- `app/models/swimming_class_weekday.ts` (new) — `SwimmingClassWeekday extends SwimmingClassWeekdaySchema`.
  - `@belongsTo(() => SwimmingClass)` — owning class series.
- `app/models/swimming_class_session.ts` (new) — `SwimmingClassSession extends SwimmingClassSessionSchema`.
  - `@belongsTo(() => SwimmingClass)` — owning class series.
  - `get isCancelled` — true when `cancelledAt` is set.
  - `cancel()` — sets `cancelledAt`; row remains visible.
- `app/models/class_stage.ts` (new) — `ClassStage extends ClassStageSchema`.
  - `@belongsTo(() => SwimmingClass)` — owning class series.
  - `@hasMany(() => ClassStageSkill)` — stage-skill pivot rows.
  - `@manyToMany(() => Skill)` through `class_stage_skills` — convenient stage skill reads; both sides must agree on pivot table per `model-relationships.md`.
- `app/models/class_stage_skill.ts` (new) — `ClassStageSkill extends ClassStageSkillSchema`.
  - `@belongsTo(() => ClassStage)` — owning stage.
  - `@belongsTo(() => Skill)` — attached skill.
- `app/models/school.ts` (modified) — add class and skill relationships.
  - `@hasMany(() => SwimmingClass)` — school class series.
  - `@hasMany(() => Skill)` — school-specific skills.
- `app/models/level.ts` (modified) — add class relationship.
  - `@hasMany(() => SwimmingClass)` — classes scheduled for the level.
- `app/models/membership.ts` (modified) — add instructor relationship.
  - `@hasMany(() => SwimmingClass, { foreignKey: 'instructorMembershipId' })` — classes instructed by this accepted member.
- `app/models/invitation.ts` (modified) — add pending instructor relationship.
  - `@hasMany(() => SwimmingClass, { foreignKey: 'pendingInstructorInvitationId' })` — classes waiting on this invitation.

`node ace migration:run`

Harness invariants carried into build:

- `database/schema.ts` is generated; do not hand-edit it.
- Relationships live on models, never generated schema classes.
- Relationship decorators use lazy callbacks (`() => Model`) to avoid circular imports.
- Relationship persistence should go through `related(...)` helpers where a parent is already loaded; build should not re-derive foreign keys by hand.
- Schema rules are unnecessary unless Lucid’s generator emits an incorrect type for `time` or boolean columns; prefer model-level overrides for per-model boolean SQLite binding.

## Service design

Reads: services.md, controllers.md

`node ace make:service class_series_authoring`

- `app/services/class_series_authoring_service.ts` — `ClassSeriesAuthoringService`.
  - `create(school: School, manager: User, data: StoreSwimmingClassInput): Promise<SwimmingClass>` — creates a class series in one transaction: code, class row, weekdays, stages, stage skills, optional school-specific skills, optional pending Teacher invitation, and generated sessions.
    - Enforces cross-record rules that are not expressible by Vine alone: level availability for the school, capacity ≤ level capacity, instructor eligibility, pending Teacher invitation shape, skill availability, at least one generated session.
    - Uses existing mail/invitation conventions for pending Teacher invitation; sends after transaction commit / outside failed transaction boundaries.
  - `update(swimmingClass: SwimmingClass, editor: User, data: UpdateSwimmingClassInput): Promise<SwimmingClass>` — updates class details, instructor/pending-instructor assignment, stage ordering/skills, and schedule fields; regenerates future sessions when date/weekdays/time changes while preserving past sessions.
  - `cancel(swimmingClass: SwimmingClass): Promise<SwimmingClass>` — marks the class series cancelled by setting `cancelledAt`; does not delete class, stages, skills, or sessions.
  - `cancelSession(session: SwimmingClassSession): Promise<SwimmingClassSession>` — marks one generated session cancelled by setting `cancelledAt`; does not delete the session row.
  - Does NOT: read `HttpContext`, validate raw request bodies, flash messages, choose redirects, render pages, or decide route-level permissions.

`node ace make:service class_schedule_generation`

- `app/services/class_schedule_generation_service.ts` — `ClassScheduleGenerationService`.
  - `generate(data: ClassScheduleInput): ClassSessionDraft[]` — computes session start/end datetimes from date range, weekdays, start time, and end time; returns plain drafts for persistence by the authoring service.
  - `regenerateFuture(swimmingClass: SwimmingClass, data: ClassScheduleInput): Promise<ClassSessionDraft[]>` — computes the replacement future schedule while treating past sessions as immutable history.
  - Does NOT: persist class rows, mutate cancellations, validate user permissions, invite instructors, or render schedule UI.

Supporting type placement:

- `types/swimming_class.ts` (new) — shared service input/output types because both controllers and services need them without exporting types from controller/service files.
  - `StoreSwimmingClassInput`
  - `UpdateSwimmingClassInput`
  - `ClassScheduleInput`
  - `ClassSessionDraft`

Harness invariants carried into build:

- Services are extracted because class authoring is a named domain workflow spanning class, schedule sessions, stages, skills, memberships, invitations, and mail.
- Controllers extract request data and pass models/validated payloads; services stay HTTP-agnostic.
- Service methods are domain steps, not framework wrappers.
- Per-request state remains on controllers; services do not store request state on the instance.

## Validation

Reads: validation.md, vine/types/string.md, vine/types/number.md, vine/types/date.md, vine/types/boolean.md, vine/types/array.md, vine/types/object.md, vine/types/enum.md, vine/types/union.md

### Input validation

`node ace make:validator swimming_class`

```ts title="app/validators/swimming_class.ts"
import vine from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'
import db from '@adonisjs/lucid/services/db'

async function uniqueClassCode(value: unknown, _options: undefined, field: FieldContext) {
  if (typeof value !== 'string') {
    return
  }

  const schoolId = field.meta.schoolId as number
  const swimmingClassId = field.meta.swimmingClassId as number | undefined
  const query = db
    .from('swimming_classes')
    .where('school_id', schoolId)
    .whereRaw('lower(code) = ?', [value.trim().toLowerCase()])

  if (swimmingClassId) {
    query.whereNot('id', swimmingClassId)
  }

  const existing = await query.first()
  if (existing) {
    field.report('A class with this code already exists.', 'class.code.unique', field)
  }
}

const uniqueClassCodeRule = vine.createRule(uniqueClassCode)

const timeRule = () =>
  vine
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)

const stageObject = {
  id: vine.number().withoutDecimals().positive().optional(),
  name: vine.string().trim().minLength(1).maxLength(120),
  position: vine.number().withoutDecimals().positive(),
  skillIds: vine.array(vine.number().withoutDecimals().positive()).distinct().optional(),
  newSkills: vine
    .array(
      vine.object({
        name: vine.string().trim().minLength(1).maxLength(120),
        description: vine.string().trim().maxLength(2000).nullable().optional(),
      })
    )
    .optional(),
}

export const storeSwimmingClassValidator = vine.withMetaData<{ schoolId: number }>().create({
  levelId: vine.number().withoutDecimals().positive().exists({ table: 'levels', column: 'id' }),
  code: vine.string().trim().toUpperCase().maxLength(30).use(uniqueClassCodeRule()).optional(),
  name: vine.string().trim().minLength(1).maxLength(120),
  startDate: vine.date({ formats: ['YYYY-MM-DD'] }),
  endDate: vine.date({ formats: ['YYYY-MM-DD'] }).afterOrSameAs('startDate'),
  weekdays: vine.array(vine.number().withoutDecimals().in([1, 2, 3, 4, 5, 6, 7])).distinct().notEmpty(),
  startTime: timeRule(),
  endTime: timeRule(),
  capacity: vine.number().withoutDecimals().positive(),
  location: vine.string().trim().minLength(1).maxLength(255),
  instructorMode: vine.enum(['existing', 'invite']),
  instructorMembershipId: vine.number().withoutDecimals().positive().optional(),
  inviteTeacherEmail: vine.string().trim().normalizeEmail().email().maxLength(254).optional(),
  inviteTeacherName: vine.string().trim().minLength(1).maxLength(255).optional(),
  inviteTeacherPhone: vine.string().trim().minLength(1).maxLength(50).optional(),
  stages: vine.array(vine.object(stageObject)).distinct('position').notEmpty(),
})

const updateIntent = vine.group([
  vine.group.if((data) => data.intent === 'cancel', {
    intent: vine.enum(['cancel']),
  }),
  vine.group.else({
    intent: vine.enum(['update']).optional(),
    levelId: vine.number().withoutDecimals().positive().exists({ table: 'levels', column: 'id' }),
    code: vine.string().trim().toUpperCase().maxLength(30).use(uniqueClassCodeRule()).optional(),
    name: vine.string().trim().minLength(1).maxLength(120),
    startDate: vine.date({ formats: ['YYYY-MM-DD'] }),
    endDate: vine.date({ formats: ['YYYY-MM-DD'] }).afterOrSameAs('startDate'),
    weekdays: vine.array(vine.number().withoutDecimals().in([1, 2, 3, 4, 5, 6, 7])).distinct().notEmpty(),
    startTime: timeRule(),
    endTime: timeRule(),
    capacity: vine.number().withoutDecimals().positive(),
    location: vine.string().trim().minLength(1).maxLength(255),
    instructorMode: vine.enum(['existing', 'invite']),
    instructorMembershipId: vine.number().withoutDecimals().positive().optional(),
    inviteTeacherEmail: vine.string().trim().normalizeEmail().email().maxLength(254).optional(),
    inviteTeacherName: vine.string().trim().minLength(1).maxLength(255).optional(),
    inviteTeacherPhone: vine.string().trim().minLength(1).maxLength(50).optional(),
    stages: vine.array(vine.object(stageObject)).distinct('position').notEmpty(),
  }),
])

export const updateSwimmingClassValidator = vine.withMetaData<{
  schoolId: number
  swimmingClassId: number
}>().create(vine.object({}).merge(updateIntent))
```

`node ace make:validator swimming_class_session`

```ts title="app/validators/swimming_class_session.ts"
import vine from '@vinejs/vine'

export const cancelSwimmingClassSessionValidator = vine.create({
  intent: vine.enum(['cancel']),
})
```

### Business rules

- Blank `code` means the service auto-generates a school-scoped class code. Owner: `ClassSeriesAuthoringService.create/update`.
- `startTime` must be earlier than `endTime`; regex only validates shape. Owner: `ClassSeriesAuthoringService.create/update`.
- Date range + weekdays must produce at least one session. Owner: `ClassScheduleGenerationService.generate`, surfaced by `ClassSeriesAuthoringService`.
- Selected level must be available for the active school, respecting `SchoolLevelSetting.available` defaulting to available when no row exists. Owner: `ClassSeriesAuthoringService`.
- Class capacity cannot exceed the selected level capacity; failure message remains exactly `"Class capacity cannot exceed the level capacity."`. Owner: `ClassSeriesAuthoringService`.
- `instructorMode='existing'` requires `instructorMembershipId`; that membership must belong to the active school and hold Teacher or Head Coach/Head Teacher. Owner: `ClassSeriesAuthoringService`.
- `instructorMode='invite'` requires `inviteTeacherEmail`, `inviteTeacherName`, and `inviteTeacherPhone`; the invitation must be for the Teacher role in the active school. Owner: `ClassSeriesAuthoringService`.
- A class must have at least one stage and every stage must end with at least one skill after combining `skillIds` and `newSkills`. Owner: `ClassSeriesAuthoringService`.
- Existing `skillIds` must be available to the active school: school-specific skills for that school plus platform default skills only when the school’s organisation is premium. Owner: `ClassSeriesAuthoringService`.
- `newSkills` create school-specific skills only; platform default skills are read-only. Owner: `ClassSeriesAuthoringService`.
- Update payload stage IDs, when present, must belong to the class being edited. Owner: `ClassSeriesAuthoringService`.
- Class cancellation and session cancellation are inline update intents; the confirmation popup is a frontend affordance, while the validator only accepts the submitted cancellation intent. Owner: controllers + validators.

## Authorization + segregation

Reads: authentication.md, authorization.md

- Permission / role keys: `start/permissions.ts`
  - `class.view` — view classes and scheduled sessions for the active school.
    - Granted to every school role: Administrator, Head Coach/Head Teacher, Teacher, Deck Supervisor, Parent, and Student.
  - `class.manage` — create, edit, cancel class series; create school-specific skills during class setup; invite a pending Teacher as part of class creation.
    - Granted to Administrator and Head Coach/Head Teacher only.
  - `invitation.create` remains unchanged for standalone member invitations. Class-created Teacher invitations are gated by `class.manage` because they are part of the class-authoring workflow, not the public invitation screen.
  - `program.manage` remains unchanged for shared program/level authoring; class creation under an existing level uses `class.manage`, not `program.manage`.
  - Build adds a grant migration to update existing role permission JSON for the new keys.

- Route-level authorization:
  - `SwimmingClassesController.index` — `middleware.auth()`, `middleware.completeProfile()`, `middleware.activeSchool()`, `middleware.authorize('class.view')`.
  - `SwimmingClassesController.show` — same as `index`.
  - `SwimmingClassesController.create` — same auth/profile/school chain plus `middleware.authorize('class.manage')`.
  - `SwimmingClassesController.store` — same auth/profile/school chain plus `middleware.authorize('class.manage')`.
  - `SwimmingClassesController.edit` — same auth/profile/school chain plus `middleware.authorize('class.manage')`.
  - `SwimmingClassesController.update` — same auth/profile/school chain plus `middleware.authorize('class.manage')`.
  - `SwimmingClassSessionsController.update` — same auth/profile/school chain plus `middleware.authorize('class.manage')`.

- Query segregation:
  - `SwimmingClassesController.index` — query `swimming_classes.schoolId = auth.getUserOrFail().activeSchoolId`.
  - `SwimmingClassesController.show/edit/update` — load class by `id` and `schoolId = activeSchoolId`; missing or cross-school IDs become 404 rather than leaking existence.
  - `SwimmingClassSessionsController.update` — load session by `id` with `whereHas('swimmingClass', class.schoolId = activeSchoolId)`.
  - Level picker and selected-level validation — only allow levels that are available to the active school. Absence of `SchoolLevelSetting` means available by default, matching Programs state.
  - Instructor picker — only memberships in the active school with Teacher or Head Coach/Head Teacher roles.
  - Skill picker — school-specific skills where `skill.schoolId = activeSchoolId`; include platform default skills only when `activeOrganisation.isPremium` is true.
  - Stage skill validation — re-check every submitted skill ID with the same active-school availability query; never trust frontend picker contents.
  - Pending Teacher invitation — create/find only for `schoolId = activeSchoolId` and Teacher role.

- Policies:
  - None planned for this change. The runtime conditions are all active-school ownership and permission-key gates; the plan uses route middleware plus active-school-scoped queries instead of a Bouncer policy.
  - Harness invariant: do not pair `middleware.authorize('key')` with a policy that gates the same key; pure permission-key gates belong in middleware.

- Frontend gates:
  - Use existing `userPermissions` shared prop from `InertiaMiddleware.share()`.
  - Use `<Guard for="class.manage">` to show Create/Edit/Cancel controls.
  - Class read navigation can be visible to members who hold `class.view`; dashboard/sidebar can use `<Guard for="class.view">` for the Classes link.

- Authentication invariants:
  - All class routes use `middleware.auth()` and controllers read the user through `auth.getUserOrFail()`.
  - No new guard is introduced; roles remain school-scoped on `Membership`.
  - No organisation-level role or permission subject is introduced.

## Controllers

Reads: controllers.md, http-context.md, request.md, middleware.md, model-relationships.md

`node ace make:controller swimming_classes --resource`

- `app/controllers/swimming_classes_controller.ts` (new).
  - `index` — wiring: authenticated user from `auth.getUserOrFail()`, active school id, `SwimmingClass.query()`, `SwimmingClassTransformer`, render `classes/index`.
    - Query `where('schoolId', activeSchoolId)`; order non-cancelled/upcoming first by schedule/date semantics chosen in service/query.
    - Preload level → program, instructor membership → user, pending invitation, stages → skills, and sessions needed by the transformer.
    - Pure read path; no service required.
  - `show` — wiring: route `params.id`, active school id, scoped class lookup, `SwimmingClassTransformer.forDetail`, render `classes/show`.
    - Load by `id` + `schoolId` to avoid cross-school leakage.
    - Preload level → program, instructor membership → user, pending invitation, weekdays, ordered stages → skills, and sessions ordered by `startsAt`.
  - `create` — wiring: active school id, optional query param `levelId`, available levels query, eligible instructor memberships query, available skills query, `SwimmingClassFormTransformer`/plain lookup props, render `classes/create`.
    - Query param may preselect a level, but selected level is still validated in `store`.
    - Available levels include program data and active-school availability settings; levels unavailable to the school are excluded from create choices.
    - Instructor picker includes active-school memberships with Teacher or Head Coach/Head Teacher roles.
    - Skill picker includes school skills plus default skills only when active organisation is premium.
  - `store` — wiring: `storeSwimmingClassValidator`, `ClassSeriesAuthoringService.create`, flash `success: "Class created."`, redirect `swimming_classes.show`.
    - Method injection for `ClassSeriesAuthoringService` is acceptable; class-level injection is also acceptable because both `store` and `update` use it. Plan recommends class-level injection.
    - Pass `school`, authenticated manager user, and validated payload into service; do not pass `HttpContext`.
    - Validator metadata carries `schoolId` for school-scoped code uniqueness.
    - Ordering invariant: route middleware authorizes `class.manage`; then controller validates request; service enforces cross-record business rules.
  - `edit` — wiring: active-school-scoped class lookup, same lookup props as `create`, `SwimmingClassTransformer.forEdit`, render `classes/edit`.
    - Preload weekdays, ordered stages → skills, instructor membership, pending invitation.
    - Form props include existing class values and picker data.
  - `update` — wiring: active-school-scoped class lookup, `updateSwimmingClassValidator`, `ClassSeriesAuthoringService.update` or `.cancel`, flash, redirect.
    - If validated payload has `intent === 'cancel'`, call `authoring.cancel(swimmingClass)`, flash `success: "Class cancelled."`, redirect to `swimming_classes.show`.
    - Otherwise call `authoring.update(swimmingClass, user, payload)`, flash `success: "Class updated."`, redirect to `swimming_classes.show`.
    - Validator metadata carries `schoolId` and `swimmingClassId` for school-scoped code uniqueness on update.
    - Service owns schedule-regeneration branch: future sessions regenerated when date/weekdays/time changes; past sessions remain unchanged.
    - Non-default architecture reason: update spans class row, schedule rows, stage rows, skill rows, instructor assignment, and optional invitation.

`node ace make:controller swimming_class_sessions`

- `app/controllers/swimming_class_sessions_controller.ts` (new).
  - `update` — wiring: route `params.id`, active-school-scoped session lookup through `whereHas('swimmingClass')`, `cancelSwimmingClassSessionValidator`, `ClassSeriesAuthoringService.cancelSession`, flash `success: "Session cancelled."`, redirect back to class show.
    - Validate cancellation intent before mutating.
    - Preload `swimmingClass` before redirect so the controller can route to `swimming_classes.show`.
    - Query segregation: session id alone is accepted on shallow route, but lookup requires owning class in active school.
    - Non-default architecture reason: uses service for the domain cancellation step and ownership-preserving invariants.

- `app/controllers/programs_controller.ts` (modified).
  - `index` — wiring remains existing programs list; add class-creation navigation data only as needed by the page.
    - The page can render “Create class” links for available levels using existing transformed level `available` value and `class.manage` frontend guard.
    - No program write behavior changes.

- DI:
  - `SwimmingClassesController` — class-level `@inject()` with `ClassSeriesAuthoringService` because `store` and `update` both use it.
  - `SwimmingClassSessionsController` — constructor or method injection; recommend method injection because only `update` uses the service.
  - No controller receives `HttpContext` through a service; services receive explicit models/payloads.

- Per-action middleware overrides:
  - Defined in routes rather than controllers:
    - read actions (`index`, `show`) use `class.view`;
    - write/form actions (`create`, `store`, `edit`, `update`) use `class.manage`;
    - session `update` uses `class.manage`.

Harness invariants carried into build:

- Actions type `HttpContext` first and destructure only what they need.
- Request bodies use `request.validateUsing(...)`; no `request.all()` / ad hoc trusted body reads.
- Route params are read from `params` and constrained in routes; they are not validated through Vine.
- Rich model props are transformed at top level before `inertia.render`.
- Missing/cross-school resources should use scoped `firstOrFail()` so they resolve to 404.
- Every relationship read by a transformer must be preloaded in the controller query.

## Response layer

Reads: transformers.md, response.md, session.md, exception-handling.md

`node ace make:transformer skill`

- `app/transformers/skill_transformer.ts` — `SkillTransformer`.
- Fields needing transformation:
  - `scope: 'school' | 'platform'` — computed from `isDefault` / `schoolId`; pages use it to label school-specific vs platform default skills.
  - `editable: boolean` — true for school-specific skills, false for platform defaults.
- Pass-through fields: `id`, `schoolId`, `name`, `description`, `isDefault`.
- Relationships to preload before transform: none.
- Runtime context required: none.

`node ace make:transformer membership`

- `app/transformers/membership_transformer.ts` — `MembershipTransformer`.
- Fields needing transformation:
  - `user`:
    - `id: number`
    - `fullName: string | null`
    - `email: string`
    - `phone: string | null`
  - `roles: string[]` — role names preloaded from the membership role relation for instructor labels.
  - `label: string` — backend-formatted display label, preferring user full name then email.
- Pass-through fields: `id`, `schoolId`, `userId`.
- Relationships to preload before transform: `user`, `roles`.
- Runtime context required: none.

`node ace make:transformer invitation`

- `app/transformers/invitation_transformer.ts` — `InvitationTransformer`.
- Fields needing transformation:
  - `inviteeName: string | null` — pending instructor display name.
  - `inviteePhone: string | null` — pending instructor phone.
  - `status: 'pending' | 'accepted' | 'expired'` — computed from invitation timestamps.
  - `label: string` — backend-formatted pending-instructor label using invitee name/email.
- Pass-through fields: `id`, `schoolId`, `email`, `roleId`.
- Relationships to preload before transform: `role`.
- Runtime context required: none.

`node ace make:transformer swimming_class_session`

- `app/transformers/swimming_class_session_transformer.ts` — `SwimmingClassSessionTransformer`.
- Fields needing transformation:
  - `startsAt: { raw: string; formatted: string }` — raw ISO for calculations, formatted date/time for display.
  - `endsAt: { raw: string; formatted: string }` — raw ISO for calculations, formatted time for display.
  - `cancelledAt: { raw: string | null; formatted: string | null }` — cancellation timestamp for member-visible cancelled status.
  - `isCancelled: boolean` — computed from `cancelledAt`.
- Pass-through fields: `id`, `swimmingClassId`.
- Relationships to preload before transform: none.
- Runtime context required: none; format with Luxon `.toFormat(...)` because no i18n package is installed.

`node ace make:transformer class_stage`

- `app/transformers/class_stage_transformer.ts` — `ClassStageTransformer`.
- Fields needing transformation:
  - `skills: Data.Skill[]` — stage skills through `SkillTransformer`.
- Pass-through fields: `id`, `swimmingClassId`, `name`, `position`.
- Relationships to preload before transform: `skills`.
- Runtime context required: none.

`node ace make:transformer swimming_class`

- `app/transformers/swimming_class_transformer.ts` — `SwimmingClassTransformer`.
- Fields needing transformation:
  - `code: string` — visible class code.
  - `dateRange`:
    - `start: { raw: string; formatted: string }`
    - `end: { raw: string; formatted: string }`
  - `meetingTime`:
    - `start: { raw: string; formatted: string }`
    - `end: { raw: string; formatted: string }`
  - `capacity: { raw: number; formatted: string }` — display as e.g. `12 learners`.
  - `isCancelled: boolean` — computed from `cancelledAt`.
  - `instructor`:
    - `status: 'active' | 'pending'`
    - `membership: Data.Membership | undefined`
    - `invitation: Data.Invitation | undefined`
    - `label: string`
  - `level` — nested plain/transformer-backed shape from preloaded `Level` + `Program`:
    - `id`, `name`, `capacity`, `programName`
  - `stages: Data.ClassStage[]` — ordered stage progression path.
  - `sessions: Data.SwimmingClassSession[]` — generated schedule rows.
- Pass-through fields: `id`, `schoolId`, `levelId`, `name`, `location`, `instructorMembershipId`, `pendingInstructorInvitationId`.
- Relationships to preload before transform: `level.program`, `instructorMembership.user`, `instructorMembership.roles`, `pendingInstructorInvitation.role`, `stages.skills`, `sessions`.
- Runtime context required: none.
- Variants:
  - `forDetail` — includes full stages and all sessions.
  - `forEdit` — includes form-ready raw dates/times, weekdays, stages with selected skill ids, instructor mode, and pending invitation snapshot.
  - default/list shape — includes summary fields, instructor label, next upcoming session, cancellation status, and omits heavy stage/session detail.

`node ace make:transformer level`

- `app/transformers/level_transformer.ts` (modified) — add `forClassOption` variant.
- Fields needing transformation:
  - `programName: string` — from preloaded `program`.
  - `fee`/`available` remain existing school-aware output from current transformer.
- Pass-through fields: existing level fields plus `id`, `name`, `capacity`, `ageGroup`.
- Relationships to preload before transform: `program`, `schoolLevelSettings`.
- Runtime context required: existing constructor school id remains the acquisition path.

Response / exception decisions:

- `app/exceptions/class_authoring_exception.ts` — self-handled domain exception for service-level recoverable business failures such as unavailable level, invalid instructor, invalid skill, no generated sessions, or capacity over the level capacity.
  - Handles by `ctx.session.flash('error', message)` then `ctx.response.redirect().back()`.
  - The capacity message must remain exactly `"Class capacity cannot exceed the level capacity."`.
  - Controllers do not catch it; exception handling follows `exception-handling.md`.
- Successful writes use the exact flash messages from the brief:
  - `Class created.`
  - `Class updated.`
  - `Class cancelled.`
  - `Session cancelled.`
  - `Teacher invited.`
- When class creation both creates the class and invites a Teacher, the controller/service outcome should allow both success messages to be surfaced, with `Class created.` and `Teacher invited.` flashed for the next request.
- Inertia pages receive rich model data only through top-level transformers. Lookup lists that originate from models use transformers at the top-level prop (`levelOptions`, `instructorOptions`, `skillOptions`).
- Pages render flash through the existing layout; class pages do not render their own flash banners.

## Routes

Reads: routing.md

```diff title="start/routes.ts"
 // Swim programs — shared catalog (all members view; Admin/Head Coach manage)
 // plus each school's per-level fee/availability settings.
 router
   .group(() => {
     router
       .resource('programs', controllers.Programs)
       .except(['show'])
       .use(['create', 'store', 'edit', 'update', 'destroy'], middleware.authorize('program.manage'))

     router
       .patch('levels/:id/settings', [controllers.LevelSettings, 'update'])
       .use(middleware.authorize('program.manage'))
   })
   .use(middleware.auth())
   .use(middleware.completeProfile())
   .use(middleware.activeSchool())
+
+// Swimming classes — school-scoped class series and generated sessions.
+router
+  .group(() => {
+    router
+      .resource('classes', controllers.SwimmingClasses)
+      .except(['destroy'])
+      .where('id', router.matchers.number())
+      .use(['index', 'show'], middleware.authorize('class.view'))
+      .use(['create', 'store', 'edit', 'update'], middleware.authorize('class.manage'))
+
+    router
+      .patch('class-sessions/:id', [controllers.SwimmingClassSessions, 'update'])
+      .where('id', router.matchers.number())
+      .use(middleware.authorize('class.manage'))
+  })
+  .use(middleware.auth())
+  .use(middleware.completeProfile())
+  .use(middleware.activeSchool())
```

Verify route names with `node ace list:routes`.

Route-name expectations to verify, not assume in code until the command is run:

- `swimming_classes.index`
- `swimming_classes.show`
- `swimming_classes.create`
- `swimming_classes.store`
- `swimming_classes.edit`
- `swimming_classes.update`
- `swimming_class_sessions.update`

## Events + side effects

Reads: mail.md

- Events:
  - None introduced. Class authoring is synchronous from the request’s perspective except for queued email delivery; no event/listener layer is needed for this change.

- Listeners:
  - None introduced.

- Mail side effects:
  - `app/mails/invitation.ts` (modified) — existing `InvitationMail`.
    - Continue using `mail.sendLater(...)` for pending Teacher invitation emails.
    - Add optional invitee display context only if needed by templates; the route authority remains the existing invitation token.
    - Subject remains school-oriented: `You've been invited to join <schoolName>`.
  - `resources/views/emails/invitation_html.edge` and `resources/views/emails/invitation_text.edge` (modified if needed).
    - Keep role/school wording; Teacher invitations created from class setup use the same accept link and role copy as standalone invitations.
  - `ClassSeriesAuthoringService.create/update` side effect:
    - When `instructorMode='invite'`, create/update a Teacher invitation for the active school, store `invitee_name` and `invitee_phone`, queue `InvitationMail`, and return an authoring result that lets the controller flash `Teacher invited.` along with the class success message.
    - Mail should be queued only after the transaction commits or outside the transactional write block, so a rolled-back class does not send an invitation.
    - Harness invariant: do not inline mail callbacks in controllers; use mail classes and `mail.sendLater(...)`.

- Existing listener invariants:
  - None currently depend on class/session state because the project has no listener files for this area.

## Views

Reads: frontend.md, transformers.md, design-system.md

`node ace make:page classes/index`

- `inertia/pages/classes/index.tsx` (new) — page component; owns state + composition only.
  - Props: `{ classes: Data.SwimmingClass[] }`.
  - Layout: existing dashboard/default layout via shared app layout conventions.
  - Composes: `ClassCard`, reused Mantine `Container`, `Stack`, `Group`, `Title`, `Text`, `Button`; existing `<Guard>`.
  - Form submit target: none.
  - Navigation:
    - `Link route="swimming_classes.create"` for “Create class” behind `<Guard for="class.manage">`.
    - Each class links to `swimming_classes.show`.
  - Empty state: extracted to `ClassesEmptyState` because branch content should not be inline per `frontend.md`.

`node ace make:page classes/show`

- `inertia/pages/classes/show.tsx` (new) — page component; owns state for cancellation confirmation popup visibility only.
  - Props: `{ swimmingClass: Data.SwimmingClass.Variants['forDetail'] }`.
  - Layout: existing dashboard/default layout.
  - Composes: `ClassScheduleList`, `ClassStageList`, `ClassInstructorBadge`, `CancelClassButton`, `CancelSessionButton`, reused Mantine cards/badges/buttons.
  - Form submit target:
    - Class cancellation uses `<Form route="swimming_classes.update" routeParams={{ id: swimmingClass.id }}>` with hidden `intent=cancel`, submitted after confirmation popup.
    - Session cancellation uses `<Form route="swimming_class_sessions.update" routeParams={{ id: session.id }}>` with hidden `intent=cancel`, submitted after confirmation popup.
  - Navigation:
    - Back to `swimming_classes.index`.
    - Edit link to `swimming_classes.edit` behind `<Guard for="class.manage">`.
  - Cancel confirmation popup:
    - Use a reusable `ConfirmActionModal` component patterned after `LevelModal` (`Modal`, `Button`, `Group`, `Stack`).
    - Confirmation popup is client-only UI state; no separate route/page.

`node ace make:page classes/create`

- `inertia/pages/classes/create.tsx` (new) — page component; owns state + composition only.
  - Props:
    - `{ levelOptions: Data.Level.Variants['forClassOption'][] }`
    - `{ instructorOptions: Data.Membership[] }`
    - `{ skillOptions: Data.Skill[] }`
    - `{ preselectedLevelId?: number }`
  - Layout: existing dashboard/default layout.
  - Composes: `ClassFormBody`, `ClassStageModal`, `SkillPicker`, `InstructorPicker`, reused Mantine form components.
  - Form submit target: `<Form route="swimming_classes.store">`; ordinary form submission with hidden inputs for stages, skills, weekdays, instructor mode, and optional new skills.
  - Navigation: cancel/back link to `swimming_classes.index`.

`node ace make:page classes/edit`

- `inertia/pages/classes/edit.tsx` (new) — page component; owns state + composition only.
  - Props:
    - `{ swimmingClass: Data.SwimmingClass.Variants['forEdit'] }`
    - `{ levelOptions: Data.Level.Variants['forClassOption'][] }`
    - `{ instructorOptions: Data.Membership[] }`
    - `{ skillOptions: Data.Skill[] }`
  - Layout: existing dashboard/default layout.
  - Composes: `ClassFormBody`, `ClassStageModal`, `SkillPicker`, `InstructorPicker`.
  - Form submit target: `<Form route="swimming_classes.update" routeParams={{ id: swimmingClass.id }}>`.
  - Navigation: cancel/back link to `swimming_classes.show`.

- `inertia/components/class_card.tsx` (new) — class summary card for index. Extracted as: repeated/list item content.
  - Shows class code, name, level/program, instructor label/status, location, capacity, next session, cancelled badge.
  - Uses `Badge`, `Card`, `Group`, `Stack`, `Text`, `Button`, mirroring `ProgramCard`.
  - Provides view link; edit link behind `<Guard for="class.manage">`.

- `inertia/components/classes_empty_state.tsx` (new) — empty-state copy and create link. Extracted as: branch content.
  - Shows “No classes yet.” and create link behind `class.manage`.

- `inertia/components/class_form_body.tsx` (new) — shared create/edit form body. Extracted as: repeated JSX across create/edit pages.
  - Owns ephemeral UI state for weekdays, stages, instructor mode, and modal open state.
  - Renders fields for code (optional), name, level, date range, weekdays, start/end time, capacity, location, instructor choice/invite fields, and stages.
  - Emits hidden inputs for nested `stages[*][skillIds]`, `stages[*][newSkills]`, and `weekdays[]`, following the existing `ProgramFormBody` pattern.
  - Receives `errors`, `processing`, `submitLabel`, optional initial data, and picker props from page.

- `inertia/components/class_stage_modal.tsx` (new) — add/edit one class stage. Extracted as: page subcomponent.
  - Mirrors `LevelModal` structure with Mantine `Modal`.
  - Lets the user set stage name, position/order, choose available skills, and add school-specific new skills to the draft.
  - Performs light client-side required-field checks only for immediate UX; server Vine validator remains the source of truth.

- `inertia/components/skill_picker.tsx` (new) — multi-select-ish skill selector for available skills and new school-specific skills. Extracted as: page subcomponent.
  - Shows platform-default vs school-specific labels from `Data.Skill.scope`.
  - Platform default skills are read-only choices; newly added skills are school-specific draft rows.

- `inertia/components/instructor_picker.tsx` (new) — existing instructor vs invite Teacher selector. Extracted as: page subcomponent.
  - Existing instructor mode selects `Data.Membership` with Teacher/Head Coach role.
  - Invite mode collects Teacher email, name, and phone.
  - Shows copy that a pending Teacher can be assigned before accepting.

- `inertia/components/class_schedule_list.tsx` (new) — show generated sessions and cancellation actions. Extracted as: branch/repeated content.
  - Uses `Data.SwimmingClassSession[]`.
  - Shows formatted start/end, cancelled badge, and inline cancellation button behind `class.manage`.
  - Keeps cancelled sessions visible.

- `inertia/components/class_stage_list.tsx` (new) — show ordered stages and skills on the detail page. Extracted as: repeated/branch content.
  - Uses `Data.ClassStage[]`.
  - Renders order, stage name, and skill badges.

- `inertia/components/class_instructor_badge.tsx` (new) — instructor display. Extracted as: repeated label/status content.
  - Shows active instructor membership label or pending invitation label.
  - Shows `Pending` badge when `swimmingClass.instructor.status === 'pending'`.

- `inertia/components/confirm_action_modal.tsx` (new) — reusable confirmation popup for class/session cancellation. Extracted as: page subcomponent used by multiple buttons.
  - Mirrors existing modal conventions and uses Mantine `Modal`, `Group`, `Button`, `Text`.
  - Does not submit itself; parent passes confirmed callback or wraps a submit button inside.

- `inertia/components/cancel_class_button.tsx` (new) — inline cancellation trigger for class series. Extracted as: page subcomponent.
  - Wraps `ConfirmActionModal` and `<Form route="swimming_classes.update">`.
  - Hidden `intent=cancel`.
  - Guarded by parent/page with `class.manage` or self-contained guard.

- `inertia/components/cancel_session_button.tsx` (new) — inline cancellation trigger for generated sessions. Extracted as: repeated JSX per session.
  - Wraps `ConfirmActionModal` and `<Form route="swimming_class_sessions.update">`.
  - Hidden `intent=cancel`.

- `inertia/components/program_card.tsx` (modified) — add “Create class” entry point on available levels.
  - For each available level, show a `Create class` link behind `<Guard for="class.manage">`.
  - Because the preselected level is a query string, use `href={urlFor('swimming_classes.create', {}, { qs: { levelId: level.id } })}` rather than `<Link route=...>`.
  - Unavailable levels do not show the create-class link.

- `inertia/layouts/default.tsx` (modified) — add Classes navigation.
  - Add sidebar `NavLink` to `swimming_classes.index` behind `<Guard for="class.view">`.
  - Active when URL starts with `/classes`.

Design-system/convention notes:

- Reuse Mantine components already in the app: `Container`, `Stack`, `Group`, `Card`, `Badge`, `Button`, `Text`, `Title`, `TextInput`, `Textarea`, `NativeSelect`, `Modal`, `Switch`/checkbox equivalents.
- Reuse spacing conventions from `ProgramsIndex`, `ProgramCard`, `ProgramFormBody`, and `LevelModal`: `Container size="md" py="xl"`, `Stack gap="lg"`, cards with `withBorder radius="md"`.
- Use `@adonisjs/inertia/react` `Link`/`Form` for route-aware navigation/submission; only use `urlFor` when query strings are required.
- Keep browser APIs out of render/module scope; confirmation modal state is ordinary React state and SSR-safe.

## Test coverage gap

Existing browser tests cover authentication/profile routing, school creation, invitations, memberships, signups, programs, and level settings. New assertion coverage should be added for class permissions, school-scoped query segregation, class creation with manual and generated codes, capacity rejection with the exact retained message, pending Teacher invitation assignment, premium-organisation default skill availability, schedule generation/regeneration, and class/session cancellation visibility. Detailed test cases belong in `assert.md`.
