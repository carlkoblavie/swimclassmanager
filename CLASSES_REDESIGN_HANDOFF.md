# Classes redesign — handoff

Reworking Classes so classes are created **per stage** on the level page. A class = level + stage + term + skills + lesson duration + instructors. **No weekday, no start time. Skills carry NO minutes/time.** Scheduling (days/times/dated lessons) is deferred.

## Decisions (from Carl)
- "Total lessons" at the level: reuse existing `Level.classesCount` (relabel "Total lessons"). No new column.
- Class creation is per-stage only; remove the level-level inline day/time builder.
- Merge the new UI into the existing level page (`inertia/pages/levels/show.tsx`); no new route.
- Delete = soft cancel (`cancelledAt`). Duplicate = copy skills + instructors into the same stage.
- Do NOT generate lessons on class create (scheduling comes later).

## DONE — backend (already edited on disk; `tsc --noEmit` passes for app code, only the old test spec fails)
- `database/migrations/1786100000000_make_class_schedule_nullable.ts` — makes `swimming_classes.start_time` and `weekday` nullable.
- `app/validators/swimming_class.ts` — single-class `storeSwimmingClassesValidator` + `updateSwimmingClassValidator`: `{ levelId, termId, levelStageId, name?, durationMinutes, skillIds[], ...instructorFields }`. Removed `days`/`weekday`/`startTime`.
- `app/services/class_series_authoring_service.ts` — `createOne`, `duplicate`, `generatedClassName` (=> `"<Level> · <Stage>"`), `availableCopyName`; `update` drops weekday/startTime and generates name when blank; `planLesson` guarded when weekday is null; removed `createMany` + `assertUniqueWithinPayload`.
- `app/controllers/swimming_classes_controller.ts` — `store` → `createOne`; `store`/`update`/`cancel`/`duplicate` redirect to `levels.show`; added `duplicate` action; index ordered by `levelStageId`,`name`.
- `app/controllers/levels_controller.ts` — `show` now also loads `termOptions`, `instructorOptions`, `pendingInstructorOptions`, `canManageClasses` for the New class form.
- `app/transformers/swimming_class_transformer.ts` — `weekdayName`/`startTime` are now null-safe (nullable).
- `start/routes.ts` — added `POST classes/:id/duplicate` (`swimming_classes.duplicate`, authorize `class.manage`).

## TODO
1. `node ace migration:run` (regenerates `database/schema.ts`), then run the dev server (regenerates `@generated/data` via tuyau).
2. **UI — `inertia/pages/levels/show.tsx`** (Mantine; `@adonisjs/inertia/react` Form + `urlFor`; `<Guard for=...>`):
   - Header: eyebrow `PROGRAMME · <level name>`, right side age range + fee (`level.fee.formatted`); title "Classes"; subtitle: "A class is a set of skills, a stage, and how long you have to teach them. Lessons implement it later; scheduling comes later too." Show **Total lessons** = `level.classesCount` in the header meta.
   - One section per stage: colored dot + STAGE NAME + "N classes" badge (N = count of `classes` with that `levelStageId`), then that stage's class rows.
   - Class row: name (strip a trailing " · <stage>" for display since the section shows the stage), duration badge (`"45 min"`), skill pills (colored dot per skill, **no minutes**), and edit / duplicate / delete actions. Duplicate → POST `swimming_classes.duplicate`. Delete → PATCH `swimming_classes.update` with `intent=cancel` (soft cancel).
   - **New class form** (see design screenshots): Class name (optional; helper "Leave blank to use the generated name."), Stage `<select>`, Term `<select>` (reuse the term flatten + label `"<year> · <term> (start – end)"` + default-term logic from `class_inline_builder.tsx`), "Skills in this class" add/remove pills (**no minutes**), Lesson duration (mins), Lead instructor + Support (reuse `inertia/components/instructor_picker.tsx` unchanged), Clear / Create class. Submit Form route `swimming_classes.store`. Each stage's "Add class" preselects that stage.
3. Replace `inertia/components/class_inline_builder.tsx` (drop day/weekday/startTime/lessonDate machinery) — extract a shared `ClassForm`; remove its mount in `inertia/components/program_table.tsx` (~line 616).
4. `inertia/components/class_card.tsx` — remove weekday/startTime display; show duration + skill pills.
5. `inertia/pages/classes/edit.tsx` — drop weekday/startTime; reuse `ClassForm`; skills without minutes.
6. Rewrite `tests/unit/swimming_classes/authoring_service.spec.ts` for the new `createOne`/single-class model (currently references `createMany`/`days`).
7. Verify: `npm run typecheck` (server + inertia) and `node ace test`; click through create / duplicate / cancel in dev.

## Design reference
Two screenshots (Classes list + New class form) are in the Cowork chat. The New class form is titled "New class" / "Skills, stage, and duration — nothing else." with a footer "Schedule it into days and times after it exists."
