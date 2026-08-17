# Release summary — Teaching operations and dashboard

**Release date:** 16 August 2026  
**Branch:** `teacher-invite`  
**Production target:** `swimclassmanager.com` via Dokku  
**Release commits:** `d5ea529`, `c5b56ad`, `6d73479`, `beac33c`

## Overview

This release completes the core teaching-operations workflow for Swim Class Manager. It adds the operational dashboard, replaces the earlier class setup with stage-based classes, introduces lesson scheduling and lesson management, expands enrolment and learner workflows, adds instructor assignment controls, and aligns the experience with the updated role model.

## Product changes

### Dashboard

- Added the management dashboard with time-aware greetings.
- Added term-level summary cards for sign-ups, enrolments, lessons, and instructors.
- Added today’s lesson schedule with instructor and staffing status.
- Added a “Needs you” area for overdue invoices, sign-ups awaiting classes, unstaffed lessons, and incomplete registers.
- Added revenue summaries for collected, outstanding, and overdue payments.
- Financial information is hidden from instructor-facing views for now.

### Classes and curriculum

- Reworked classes so they are created within a curriculum stage.
- Classes now capture the level, stage, term, skills, duration, and instructors.
- Removed weekday and start-time requirements from class creation; scheduling is handled later through lessons.
- Added class creation, editing, duplication, cancellation, and stage-based listing.
- Updated the classes interface to use the two-column card layout and the new design direction.
- Added class skill summaries and lesson allowances.
- Preserved existing class data by making legacy schedule fields nullable rather than replacing applied migration history.

### Lessons

- Added a dedicated Lessons page with class, level, stage, date, activity-status, and instructor filters.
- Added lesson generation for a selected class and date range.
- Added recurring weekday selection, duration handling, and lesson-count previews during generation.
- Added lesson detail and editing flows.
- Added lesson activity creation and editing, including custom activities.
- Added activity copying from one lesson into other empty lessons.
- Added equipment, objectives, notes, observations, and conclusion tracking.
- Added navigation to the view-lesson page after creating a lesson.
- Added the correct empty-state messaging for managers versus instructors.

### Instructor assignment

- Added lead and supporting instructor assignment for lessons.
- Added bulk assignment across multiple selected lessons.
- Added a bottom selection bar and instructor assignment drawer.
- Added assistant coach as a supported role.
- Added instructor filtering for administrators, head coaches, and assistant coaches.
- Instructors see only lessons assigned to them.
- Instructors can manage lesson activities but cannot edit or remove lesson details.
- Teachers can view enrolments but cannot place or withdraw learners.

### Enrolment and learners

- Added the Enrolment page with unplaced, enrolled, and all learner views.
- Added search and programme filtering.
- Added multi-learner placement into classes with a persistent selection bar.
- Added class-capacity information and placement date support.
- Added age labels beside learner ages.
- Added learner profile pages with enrolment, lesson history, pathway, attendance, skills, guardian, and record sections.
- Added links from learner names to their profiles.
- Added instructor-specific enrolment visibility while retaining full management views for authorised staff.

### Members and invitations

- Added the Members page for managing school members and roles.
- Added the Assistant Coach role.
- Kept Head Coach/Head Teacher as a single-role position and removed it from the general invite selection when unavailable.
- Added role display beneath the signed-in member’s name.
- Preserved the instructor invite flow with editable starting values for name, phone, email, and role.
- Kept parent invitations visibly disabled for now.
- Kept email delivery disabled and provided a copy-friendly invitation link instead.

### Sign-ups and payments

- Added part-payment recording with learner and term selection.
- Added remaining-balance and maximum-payment guidance.
- Closed the payment dialog after successful submission.
- Added payment and enrolment data backfills for existing records.

## Permissions and authorization

- Added permissions for lesson generation, lesson editing, activity management, instructor assignment, and bulk instructor assignment.
- Aligned Administrator permissions with Head Coach/Head Teacher permissions.
- Restored `lesson.generate` for Administrator and Head Coach/Head Teacher so the generation UI is available to users who can manage classes.
- Kept role-based route protection and matching UI guards in place.
- Added production-safe forward migrations for permission changes instead of editing already-applied migrations.

## Data and migration changes

The release includes forward migrations for:

- Lesson equipment.
- Lesson instructors and supporting instructors.
- Lesson duration.
- Class placement metadata.
- Enrolment terms and paid-enrolment backfills.
- Term-payment amounts and timestamp normalization.
- Enrolment and lesson permissions.
- Assistant Coach permissions.
- Administrator and bulk instructor permissions.
- Restored lesson-generation permissions for Administrator and Head Coach/Head Teacher.

Existing production data remains on the persistent SQLite database. Applied migration history was preserved, and the release was deployed with the normal pre-deploy migration task.

## Verification

- TypeScript typecheck passed.
- Production asset build passed.
- Targeted lesson-generation browser test passed.
- Dokku build completed successfully.
- Production migration `1786810000000_restore_lesson_generation_permissions` completed successfully.
- Production container health checks passed and the new container was promoted.

## Release follow-up

- Email delivery for invitations remains intentionally disabled.
- Parent invitations remain disabled.
- Instructor-facing financial features remain hidden.
- Production HTTP smoke testing should be repeated once external DNS access is available from the test environment.
