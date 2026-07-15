# Program Draft/Active Flow — Design

**Date:** 2026-07-15
**Sequence:** built before the UI polish (`2026-07-15-programs-ui-polish-design.md`), so the polished programs page renders real statuses.

## Goal

Programs get a one-way draft → active lifecycle. New programs start as drafts, visible only to managers; activating publishes them platform-wide. Draft programs cannot have classes scheduled under their levels.

## Decisions

- **Draft means hidden until active:** members without `program.manage` never see draft programs; no classes can be created under a draft program's levels.
- **One-way transition:** draft → active only. No revert, so no edge cases with classes already scheduled under active programs.
- **Representation: `activated_at` nullable timestamp** on `programs`. Null = draft, set = active. Matches the codebase's existing one-way-state pattern (`cancelled_at` on swimming classes/sessions, `accepted_at` on invitations) and records when the program went live. A status enum was rejected as a new pattern with a YAGNI "archived" state.
- **Scope: program-level only.** Levels have no individual status; a level is usable when its program is active and it is available to the school (existing `school_level_settings` behavior, unchanged).

## 1. Schema + model

- Alter migration: add nullable `activated_at` timestamp to `programs`.
- Backfill migration: set `activated_at = now` for all existing programs — everything live today stays live on deploy.
- `Program` model: `get isActive` (true when `activatedAt` set), `activate()` (sets `activatedAt`), `scope active()` (where `activated_at` is not null).
- New programs are created with `activated_at` null (draft) — no change to the create form.

## 2. Visibility gating

Enforced at every read/write point that exposes programs or their levels:

- **`ProgramsController.index`:** users without `program.manage` get only active programs; managers get all, with status visible.
- **Class creation form (`SwimmingClassesController.create`):** level options exclude levels whose program is draft.
- **`ClassSeriesAuthoringService.create/update`:** rejects a submitted `levelId` whose program is draft (forged-ID protection), as a `ClassAuthoringException` alongside the existing level-availability check.
- **Level settings (`LevelSettingsController`):** unchanged — managers may configure fees/availability on draft programs to prep them before publishing.
- **Program edit/update/destroy:** unchanged authorization (`program.manage`).

## 3. Activation endpoint

- Follows the house intent pattern (same as swimming-class cancellation): `ProgramsController.update` accepts `intent: 'activate'` through a validator group; the default group remains the normal edit payload.
- Guarded by the existing `program.manage` route middleware — no new permission key.
- Activating an already-active program is a no-op (idempotent), not an error.
- Success flash: `Program activated.`, redirect back to the programs index.

## 4. UI (current look — the paint-up restyles this later)

- Draft/Active badge on the program card (`ProgramCard`), visible to managers; members only ever see active programs so they see no badge.
- "Activate" button on draft program cards behind `<Guard for="program.manage">`, wrapped in the existing `ConfirmActionModal` (one-way action deserves a confirm), submitting the update form with hidden `intent=activate`.
- The UI-polish spec's derived "N available" program badge is superseded: the polished table shows the real Draft/Active status badge instead.

## 5. Tests

- `ProgramFactory` gains an active default (`activated_at` set) so existing tests keep passing unchanged, plus a `draft()` state.
- Existing programs browser tests updated only where visibility semantics changed.
- New coverage:
  - Draft programs are hidden from members without `program.manage`.
  - Draft programs are visible to managers, marked as draft.
  - A manager activates a draft program (confirm → flash `Program activated.` → badge flips), and the program becomes visible to members.
  - Draft-program levels are absent from the class-create level options.
  - Service-level: class creation with a draft program's level id is rejected (unit, `ClassAuthoringException`).

## Out of scope

Revert to draft, archived state, per-level status, activation emails/notifications, scheduled publishing.
