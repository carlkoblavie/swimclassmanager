# Change Log

## v0.2

**Release date:** 17 August 2026  
**Release scope:** Curriculum, teaching operations, enrolment, instructor staffing, and term-based billing.  
**Production target:** `swimclassmanager.com` via Dokku.  
**Release commits:** `994c4f1` through `beac33c`, including `d5ea529`, `c5b56ad`, `6d73479`, and `beac33c`.

## Overview

Swim Class Manager now covers the core day-to-day workflow for a swimming school: curriculum setup, class creation, lesson planning, instructor assignment, learner placement, and term-based payment tracking. The release also aligns the interface and permissions with the updated teaching-operations model.

## Dashboard

- Added the management dashboard with time-aware greetings.
- Added term-level summary cards for sign-ups, enrolments, lessons, and instructors.
- Added today's lesson schedule with instructor and staffing status.
- Added a Needs you area for overdue invoices, sign-ups awaiting classes, unstaffed lessons, and incomplete registers.
- Added revenue summaries for collected, outstanding, and overdue payments.
- Financial information is hidden from instructor-facing views for now.

## Curriculum And Banks

- Added curriculum programs, levels, stages, stage-specific skills, and class options.
- Added skills bank management, skill families, activity bank management, categories, age groups, and bank packs.
- Added school-scoped curriculum and activity data.
- Added customer-facing level selection and purchase preparation.
- Improved program, level, stage, class, skill, and activity authoring screens.
- Added class skill summaries and lesson allowances.
- Class names are unique within a stage, so the same name can be used in different stages or levels.

## Classes

- Reworked classes so they are created within a curriculum stage.
- Classes now capture the level, stage, term, skills, duration, capacity, and instructors.
- Removed weekday and start-time requirements from class creation; recurring scheduling is handled through lessons.
- Added class creation, editing, duplication, cancellation, and stage-based listing.
- Updated class cards to use the two-column layout and current design direction.
- Prevented cancelled classes from being used for active lesson generation or new placement.
- Preserved existing class data by making legacy schedule fields nullable rather than replacing applied migration history.

## Lessons

- Added a dedicated Lessons page with class, level, stage, date, activity-status, and instructor filters.
- Added lesson generation for a selected class and date range, including recurring weekday selection, duration handling, and lesson-count previews.
- Lesson numbers now run sequentially across the full generated series instead of restarting at each month.
- Added list and calendar views, activity indicators, empty states, and lesson detail/edit flows.
- Added lesson activity creation and editing, including custom activities.
- Added copying of activities into empty lessons in the same stage.
- Added equipment, objectives, notes, observations, conclusion, and duration tracking.
- Added lesson duplication, rescheduling, and deletion flows.
- Added navigation to the view-lesson page after creating or saving a lesson.
- Lesson detail pages now link back to Lessons rather than Classes.
- Added the correct empty-state messaging for managers versus instructors.

## Instructor Assignment

- Renamed teacher-facing language to instructor.
- Added instructor invitations and instructor/member management.
- Added lead and supporting instructor assignment for lessons.
- Added instructor display on lesson lists and lesson details.
- Added bulk instructor assignment across selected lessons.
- Added assistant coach as a supported role.
- Added instructor filtering for administrators, head coaches, and assistant coaches.
- Instructors see only lessons assigned to them.
- Instructors can manage lesson activities but cannot edit or remove lesson details.
- Teachers can view enrolments but cannot place or withdraw learners.

## Enrolment And Learners

- Added the Enrolment workspace for placing registered learners into classes.
- Added Unplaced, Enrolled, and All learner views.
- Added learner search and level filtering.
- Added single-learner and bulk enrolment workflows.
- Added class selection followed by lesson selection during enrolment.
- Added enrolment start dates, join dates, and school-term association.
- Added class moves, withdrawal from class, make-up lesson support, and lesson selection changes.
- Added class capacity and remaining-place handling during placement.
- Added age labels and learner profile pages with enrolment, lesson history, pathway, attendance, skills, guardian, and record sections.
- Added links from learner names to their profiles.
- Added instructor-specific enrolment visibility while retaining full management views for authorised staff.
- Removed unnecessary selection controls from the enrolment list after placement workflow changes.
- Added protection against placing learners into cancelled classes.

## Members And Invitations

- Added the Members page for managing school members and roles.
- Added the Assistant Coach role.
- Kept Head Coach/Head Teacher as a single-role position and removed it from the general invite selection when unavailable.
- Added role display beneath the signed-in member's name.
- Preserved the instructor invite flow with editable starting values for name, phone, email, and role.
- Kept parent invitations visibly disabled for now.
- Kept email delivery disabled and provided a copy-friendly invitation link instead.

## Sign-ups And Payments

- Added signup billing status handling for Pending invoice, Invoice sent, Part paid, Paid, and Closed enquiries.
- Added manual invoice-sent and mark-as-paid actions.
- Added term-scoped payment records tied to learner enrolments.
- Added manual part-payment recording with learner, term, amount, outstanding balance, and payment-status guidance.
- Part-paid learners can proceed through enrolment placement.
- Existing learner enrolments without a purchase-item row can still expose their associated term payment where appropriate.
- Added backfill support for missing term-payment rows on existing enrolments.
- Normalized legacy term-payment timestamps for Lucid/SQLite compatibility.
- Fixed SQLite mark-as-paid updates so term payments are updated without circular query-reference serialization errors.
- Fixed mark-as-paid handling for enrolments that do not have purchase-item rows.
- Added billing details and payment actions to signup drawers.

## Permissions And Safety

- Added permission keys for enrolment withdrawal, lesson generation, lesson editing, activity management, instructor assignment, and bulk instructor assignment.
- Restricted sensitive actions such as lesson generation and withdrawal to authorised administrators and managers.
- Restored lesson-generation permissions for Administrator and Head Coach/Head Teacher after permission-registry changes.
- Aligned Administrator permissions with Head Coach/Head Teacher permissions.
- Added authorization checks to lesson, enrolment, invitation, and staffing workflows.
- Added matching UI guards so unavailable actions are hidden or disabled.

## Navigation And Interface

- Updated the main navigation to focus on Dashboard, Programs, Skills bank, Activity bank, Lessons, Sign-ups, Members, and account settings.
- Removed the duplicate Classes navigation path from lesson workflows.
- Removed duplicate organization branding from the top navigation/sidebar presentation.
- Removed initials avatars from enrolment and signup rows where they added noise.
- Added drawer-based workflows for editing lessons, instructors, activities, enrolments, and payments.
- Added scrollable long-form drawers for learner and enrolment workflows.
- Refined skills display into numbered skill tiles with pass criteria.
- Improved lesson and class cards, filters, statuses, empty states, and action placement.

## Data And Infrastructure

The release includes forward migrations and model relationships for:

- Lesson duration, equipment, activities, and instructor assignments.
- Class placement metadata and enrolment lesson selections.
- Enrolment terms and paid-enrolment backfills.
- Term payments, payment amounts, timestamp normalization, and purchase-item fallbacks.
- Curriculum entities, skills, activities, permissions, assistant coach access, and bulk instructor assignment.

Applied migration history was preserved. Existing production data remains on the persistent SQLite database, and the release was deployed with the normal pre-deploy migration task.

## Verification

- TypeScript checks passed for the server and Inertia client with `npm run typecheck`.
- Targeted ESLint checks passed for the release areas.
- Production asset build passed.
- Targeted lesson-generation browser test passed.
- Database migrations completed successfully through the term-payment timestamp normalization migration.
- The mark-as-paid term-payment update was verified with a rollback-only SQLite transaction check.
- Dokku build completed successfully.
- Production container health checks passed and the new container was promoted.

## Deferred Follow-ups

The following were discussed but are intentionally outside this release:

- Immutable payment transaction ledger and full payment-history UI.
- Automated guardian notifications and event-driven status messages.
- Pausing lesson progression due to payment status.
- Attendance-based forfeiture and absence policy automation.
- Broader payment-provider and reconciliation tooling.
- Email delivery for invitations and parent invitations.
- Instructor-facing financial features.
- Production HTTP smoke testing from an environment with external DNS access.

## Release Notes

The repository does not currently carry a semantic package version or release tag; `package.json` remains at `0.0.0`. This document describes the current release snapshot represented by the commits above.
