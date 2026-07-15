# UI Polish: Sidebar + Programs Page — Design

**Date:** 2026-07-15
**Reference:** `design/programs-list.jpg` (Visily mock, "SwimFlow Management")
**Fidelity decision:** visual style only — adopt the mock's look, populate exclusively with data the app already has. No fake numbers, no dead nav items, no backend changes.

## Goal

Polish the existing Mantine UI so it stops looking like a stock demo: a custom aquatic palette, an icon sidebar matching the mock's anatomy, and the programs list rebuilt as the mock's hierarchical table. Backend, routes, controllers, and transformers are untouched.

## 1. Theme (`inertia/theme.ts`)

- Define a custom 10-shade aquatic color ramp (pool-water blue, near the mock's `#2E7CF6`, shifted slightly toward teal) registered in `theme.colors` and set as `primaryColor`.
- Light-gray app background (`#f7f8fa`, per the mock) applied to the app shell; content surfaces stay white.
- Component defaults on the theme: `Card` with border and subtle shadow, consistent `md` radii, `Badge` defaults matching current usage.
- Font stays `system-ui` — no webfont dependency.

## 2. Sidebar (`inertia/layouts/default.tsx`)

Restructure the signed-in navbar to the mock's anatomy, real routes only:

- **Brand block:** rounded primary-color logo mark containing a wave icon, "Swim Class Manager" wordmark, small uppercase subtitle beneath (mock's "MANAGEMENT" treatment).
- **School context block:** organisation label (when present), school name, and the existing school switcher form, visually grouped.
- **Main nav** with icons from `@tabler/icons-react` (new frontend dependency):
  - Dashboard (`home`)
  - Programs (`programs.index`)
  - Classes (`swimming_classes.index`) behind `<Guard for="class.view">` — **new link; it was planned in the swimming-class blueprint but never added**
  - Sign-ups (`signups.index`) behind `<Guard for="signup.view">`
  - Invite member (`invitations.create`) behind `<Guard for="invitation.create">`
  - Active item uses the mock's filled-pill treatment.
- **Bottom-pinned section** (mock's Settings/Help slot) holding "Create a school" (`schools.create`).

The public/onboarding shell (no active school) keeps its current structure and inherits the theme.

## 3. Programs page (`inertia/pages/programs/index.tsx` + components)

Replace the card list with the mock's layout:

- **Page header:** "Swim Programs" title with a one-line subtitle; "Create New Program" primary button top-right, behind `<Guard for="program.manage">`.
- **Stat cards** (new shared `StatCard` component), computed client-side from the existing `programs` prop — no new backend data:
  - Total programs
  - Total levels
  - Levels available to your school
- **Hierarchical table** (replaces `ProgramCard`):
  - Program rows: expand chevron, program name, age-group/description line, level count, the real Draft/Active status badge (from the draft/active flow built first — see `2026-07-15-program-draft-active-design.md`; the Activate action also lives on the row for managers), and icon actions (edit, remove) behind `program.manage`.
  - Expanded level rows: level name, age-group badge, Available/Unavailable badge, fee (school-aware, existing transformer output), capacity, the existing `LevelSettingsControl` (behind `program.manage`), and the "Create class" action (behind `class.manage`, available levels only, same query-string URL as today).
  - Rows expanded by default so all asserted content is present without interaction (see test constraints).
- **Empty state:** exact current copy — "No programs yet."

Shared pieces created: `StatCard`; the page header may stay inline if a component adds no value. `ProgramCard` is deleted or reduced to the table row components.

## Constraints

- **Existing browser tests must pass without weakening.** Asserted strings survive verbatim: "No programs yet.", level fee text, "Create class", Available/Unavailable badges, manage-control visibility per role. If a control changes form (button → icon button), it keeps an accessible name the tests can locate. Full suite runs after the change.
- **No backend changes:** no controller, transformer, route, or migration edits. Everything renders from current props.
- **No new pages or nav items without routes** — global search, notifications, breadcrumbs, export, and pagination from the mock are all out of scope.

## Out of scope

Header overhaul (search, user card, bell), repainting classes/dashboard/sign-ups pages (they inherit the theme only), dark mode, custom fonts.
